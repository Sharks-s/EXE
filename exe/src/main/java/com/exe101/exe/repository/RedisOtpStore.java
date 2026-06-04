package com.exe101.exe.repository;

import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.model.entity.OtpRedis;
import com.exe101.exe.model.enums.OtpStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class RedisOtpStore implements OtpStore {

    private final StringRedisTemplate redis;

    private String key(String verifyId) {
        return "otp:REGISTER:" + verifyId;
    }

    private String userMappingKey(Long userId) {
        return "otp:REGISTER:user:" + userId;
    }

    @Override
    public void saveRegisterOtp(String verifyId, OtpRedis data, Duration ttl) {
        String key = key(verifyId);

        redis.delete(key);

        if (data.getUserId() != null) {
            redis.opsForHash().put(key, "userId", String.valueOf(data.getUserId()));
        }
        if (data.getEmail() != null) {
            redis.opsForHash().put(key, "email", data.getEmail());
        }
        redis.opsForHash().put(key, "code", data.getCode());
        redis.opsForHash().put(key, "attempts", String.valueOf(data.getAttempts()));
        redis.opsForHash().put(key, "status", data.getStatus().name());
        redis.opsForHash().put(key, "expiredAt", data.getExpiredAt().toString());
        redis.opsForHash().put(key, "createdAt", data.getCreatedAt().toString());

        redis.expire(key, ttl);
    }

    @Override
    public Optional<OtpRedis> getRegisterOtp(String verifyId) {
        String key = key(verifyId);

        if (!Boolean.TRUE.equals(redis.hasKey(key))) {
            return Optional.empty();
        }

        Map<Object, Object> map = redis.opsForHash().entries(key);
        if (map == null || map.isEmpty()) return Optional.empty();

        try {
            OtpRedis.OtpRedisBuilder builder = OtpRedis.builder()
                    .code((String) map.get("code"))
                    .attempts(Integer.parseInt((String) map.getOrDefault("attempts", "0")))
                    .status(OtpStatus.valueOf((String) map.get("status")))
                    .expiredAt(Instant.parse((String) map.get("expiredAt")))
                    .createdAt(Instant.parse((String) map.get("createdAt")));

            Object userIdObj = map.get("userId");
            if (userIdObj != null) {
                builder.userId(Long.parseLong(userIdObj.toString()));
            }

            Object emailObj = map.get("email");
            if (emailObj != null) {
                builder.email(emailObj.toString());
            }

            return Optional.of(builder.build());
        } catch (Exception ex) {
            // parsing lỗi -> coi như expired / invalid
            return Optional.empty();
        }
    }

    @Override
    public long increaseAttempts(String verifyId) {
        String key = key(verifyId);

        if (!Boolean.TRUE.equals(redis.hasKey(key))) {
            throw new BusinessException(ErrorCode.OTP_EXPIRED);
        }

        // increment returns Long
        Long val = redis.opsForHash().increment(key, "attempts", 1);
        return val == null ? 0L : val;
    }

    @Override
    public void markBlocked(String verifyId) {
        redis.opsForHash().put(key(verifyId), "status", OtpStatus.BLOCKED.name());
    }

    @Override
    public void markUsed(String verifyId) {
        redis.opsForHash().put(key(verifyId), "status", OtpStatus.USED.name());
    }

    @Override
    public void delete(String verifyId) {
        redis.delete(key(verifyId));
    }

    @Override
    public boolean exists(String verifyId) {
        return Boolean.TRUE.equals(redis.hasKey(key(verifyId)));
    }


    @Override
    public void saveUserMapping(Long userId, String verifyId, Duration ttl) {
        redis.opsForValue().set(userMappingKey(userId), verifyId, ttl);
    }

    @Override
    public Optional<String> getVerifyIdByUserId(Long userId) {
        String val = redis.opsForValue().get(userMappingKey(userId));
        return Optional.ofNullable(val);
    }

    @Override
    public void deleteUserMapping(Long userId) {
        redis.delete(userMappingKey(userId));
    }
}
