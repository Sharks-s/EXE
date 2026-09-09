package com.exe101.exe.repository;

import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.model.entity.OtpRedis;
import com.exe101.exe.model.enums.OtpStatus;
import com.exe101.exe.model.enums.OtpType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class RedisOtpStore implements OtpStore {

    private final StringRedisTemplate redis;
    private final PasswordEncoder passwordEncoder;

    private static final String OTP_PREFIX = "exe101:auth:otp:";
    private static final String OTP_USER_PREFIX = "exe101:auth:otp:user:";

    // Atomic: DEL + HSET (nhiều field) + EXPIRE trong 1 round-trip
    private static final RedisScript<Long> SAVE_OTP_SCRIPT = new DefaultRedisScript<>(
            "redis.call('DEL', KEYS[1]) " +
                    "for i = 2, #ARGV, 2 do redis.call('HSET', KEYS[1], ARGV[i], ARGV[i+1]) end " +
                    "redis.call('EXPIRE', KEYS[1], ARGV[1]) " +
                    "return 1",
            Long.class
    );

    // Atomic: check tồn tại + check BLOCKED + HINCRBY + tự set BLOCKED nếu vượt ngưỡng, tất cả trong 1 lệnh
    // Return: -1 = không tồn tại, -2 = đã BLOCKED từ trước, >0 = attempts mới sau khi tăng
    private static final RedisScript<Long> RECORD_FAILED_ATTEMPT_SCRIPT = new DefaultRedisScript<>(
            "if redis.call('EXISTS', KEYS[1]) == 0 then return -1 end " +
                    "local status = redis.call('HGET', KEYS[1], 'status') " +
                    "if status == 'BLOCKED' then return -2 end " +
                    "local attempts = redis.call('HINCRBY', KEYS[1], 'attempts', 1) " +
                    "local maxAttempts = tonumber(ARGV[1]) " +
                    "if attempts >= maxAttempts then redis.call('HSET', KEYS[1], 'status', 'BLOCKED') end " +
                    "return attempts",
            Long.class
    );

    // Atomic: chỉ chuyển UNUSED -> USED đúng 1 lần. Nếu 2 request cùng gọi gần như đồng thời,
    // chỉ request đầu tiên thấy status == UNUSED sẽ thắng, request sau nhận status khác UNUSED.
    // Return: 1 = consume thành công, 0 = key không tồn tại, -1 = status không phải UNUSED (đã USED/BLOCKED)
    private static final RedisScript<Long> CONSUME_OTP_SCRIPT = new DefaultRedisScript<>(
            "if redis.call('EXISTS', KEYS[1]) == 0 then return 0 end " +
                    "local status = redis.call('HGET', KEYS[1], 'status') " +
                    "if status ~= 'UNUSED' then return -1 end " +
                    "redis.call('HSET', KEYS[1], 'status', 'USED') " +
                    "return 1",
            Long.class
    );

    // Atomic: chỉ HSET status nếu key còn tồn tại, tránh tạo lại Hash mồ côi không TTL
    private static final RedisScript<Long> UPDATE_STATUS_IF_EXISTS_SCRIPT = new DefaultRedisScript<>(
            "if redis.call('EXISTS', KEYS[1]) == 0 then return 0 " +
                    "else redis.call('HSET', KEYS[1], ARGV[1], ARGV[2]) return 1 end",
            Long.class
    );

    private String key(String verifyId) {
        return OTP_PREFIX + verifyId;
    }

    private String userMappingKey(Long userId, OtpType type) {
        return OTP_USER_PREFIX + type.name().toLowerCase() + ":" + userId;
    }

    @Override
    public void saveOtp(String verifyId, OtpRedis data, Duration ttl) {
        String key = key(verifyId);
        String codeHash = passwordEncoder.encode(data.getCode());

        List<String> args = new ArrayList<>();
        args.add(String.valueOf(ttl.getSeconds()));

        if (data.getUserId() != null) {
            args.add("userId");
            args.add(String.valueOf(data.getUserId()));
        }
        if (data.getEmail() != null) {
            args.add("email");
            args.add(data.getEmail());
        }
        if (data.getType() != null) {
            args.add("type");
            args.add(data.getType().name());
        }
        args.add("codeHash");
        args.add(codeHash);
        args.add("attempts");
        args.add(String.valueOf(data.getAttempts()));
        args.add("status");
        args.add(data.getStatus().name());
        args.add("expiredAt");
        args.add(data.getExpiredAt().toString());
        args.add("createdAt");
        args.add(data.getCreatedAt().toString());

        redis.execute(SAVE_OTP_SCRIPT, List.of(key), args.toArray(new String[0]));
    }

    @Override
    public Optional<OtpRedis> getOtp(String verifyId) {
        String key = key(verifyId);
        Map<Object, Object> map = redis.opsForHash().entries(key);

        if (map == null || map.isEmpty()) {
            return Optional.empty();
        }

        try {
            OtpRedis.OtpRedisBuilder builder = OtpRedis.builder()
                    .codeHash((String) map.get("codeHash"))
                    .attempts(Integer.parseInt((String) map.getOrDefault("attempts", "0")))
                    .status(OtpStatus.valueOf((String) map.get("status")))
                    .expiredAt(Instant.parse((String) map.get("expiredAt")))
                    .createdAt(Instant.parse((String) map.get("createdAt")));

            Object userIdObj = map.get("userId");
            if (userIdObj != null) builder.userId(Long.parseLong(userIdObj.toString()));

            Object emailObj = map.get("email");
            if (emailObj != null) builder.email(emailObj.toString());

            Object typeObj = map.get("type");
            if (typeObj != null) builder.type(OtpType.valueOf(typeObj.toString()));

            return Optional.of(builder.build());
        } catch (Exception ex) {
            throw new IllegalStateException(
                    "Không thể deserialize dữ liệu OTP từ Redis cho verifyId=" + verifyId, ex);
        }
    }

    @Override
    public boolean matchesCode(OtpRedis otp, String rawCode) {
        return passwordEncoder.matches(rawCode, otp.getCodeHash());
    }

    @Override
    public long recordFailedAttempt(String verifyId, int maxAttempts) {
        Long result = redis.execute(
                RECORD_FAILED_ATTEMPT_SCRIPT,
                List.of(key(verifyId)),
                String.valueOf(maxAttempts)
        );

        if (result == null || result == -1L) {
            throw new BusinessException(ErrorCode.OTP_EXPIRED);
        }
        if (result == -2L) {
            throw new BusinessException(ErrorCode.OTP_BLOCKED);
        }
        return result;
    }

    @Override
    public boolean consumeOtp(String verifyId) {
        Long result = redis.execute(CONSUME_OTP_SCRIPT, List.of(key(verifyId)));
        return result != null && result == 1L;
    }

    @Override
    public void markBlocked(String verifyId) {
        updateStatus(verifyId, OtpStatus.BLOCKED);
    }

    private void updateStatus(String verifyId, OtpStatus status) {
        Long result = redis.execute(
                UPDATE_STATUS_IF_EXISTS_SCRIPT,
                List.of(key(verifyId)),
                "status", status.name()
        );

        if (result == null || result == 0L) {
            throw new BusinessException(ErrorCode.OTP_EXPIRED);
        }
    }

    @Override
    public void delete(String verifyId) {
        getOtp(verifyId).ifPresent(otp -> {
            if (otp.getUserId() != null && otp.getType() != null) {
                // Chỉ xóa mapping nếu nó đang thực sự trỏ tới verifyId này
                getVerifyIdByUserId(otp.getUserId(), otp.getType())
                        .filter(mapped -> mapped.equals(verifyId))
                        .ifPresent(mapped -> deleteUserMapping(otp.getUserId(), otp.getType()));
            }
        });
        redis.delete(key(verifyId));
    }

    @Override
    public boolean exists(String verifyId) {
        return Boolean.TRUE.equals(redis.hasKey(key(verifyId)));
    }

    @Override
    public void saveUserMapping(Long userId, OtpType type, String verifyId, Duration ttl) {
        redis.opsForValue().set(userMappingKey(userId, type), verifyId, ttl);
    }

    @Override
    public Optional<String> getVerifyIdByUserId(Long userId, OtpType type) {
        String val = redis.opsForValue().get(userMappingKey(userId, type));
        return Optional.ofNullable(val);
    }

    @Override
    public void deleteUserMapping(Long userId, OtpType type) {
        redis.delete(userMappingKey(userId, type));
    }
}
