package com.exe101.exe.repository;

import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.model.entity.OtpData;
import com.exe101.exe.model.enums.OtpStatus;
import com.exe101.exe.model.enums.OtpType;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Repository
@RequiredArgsConstructor
public class InMemoryOtpStore implements OtpStore {

    private final PasswordEncoder passwordEncoder;
    private final ConcurrentMap<String, StoredOtp> otps = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, StoredMapping> userMappings = new ConcurrentHashMap<>();

    @Override
    public void saveOtp(String verifyId, OtpData otp, Duration ttl) {
        Instant expiresAt = Instant.now().plus(ttl);
        OtpData storedOtp = OtpData.builder()
                .userId(otp.getUserId())
                .email(otp.getEmail())
                .type(otp.getType())
                .codeHash(passwordEncoder.encode(otp.getCode()))
                .attempts(otp.getAttempts())
                .status(otp.getStatus())
                .createdAt(otp.getCreatedAt())
                .expiredAt(otp.getExpiredAt())
                .build();

        otps.put(verifyId, new StoredOtp(storedOtp, expiresAt));
    }

    @Override
    public Optional<OtpData> getOtp(String verifyId) {
        StoredOtp stored = otps.get(verifyId);
        if (stored == null) {
            return Optional.empty();
        }
        if (stored.isExpired()) {
            delete(verifyId);
            return Optional.empty();
        }
        return Optional.of(stored.otp());
    }

    @Override
    public long recordFailedAttempt(String verifyId, int maxAttempts) {
        StoredOtp stored = otps.get(verifyId);
        if (stored == null || stored.isExpired()) {
            delete(verifyId);
            throw new BusinessException(ErrorCode.OTP_EXPIRED);
        }

        synchronized (stored) {
            OtpData otp = stored.otp();
            if (otp.getStatus() == OtpStatus.BLOCKED) {
                throw new BusinessException(ErrorCode.OTP_BLOCKED);
            }

            int attempts = otp.getAttempts() + 1;
            otp.setAttempts(attempts);
            if (attempts >= maxAttempts) {
                otp.setStatus(OtpStatus.BLOCKED);
            }
            return attempts;
        }
    }

    @Override
    public boolean consumeOtp(String verifyId) {
        StoredOtp stored = otps.get(verifyId);
        if (stored == null || stored.isExpired()) {
            delete(verifyId);
            return false;
        }

        synchronized (stored) {
            if (stored.otp().getStatus() != OtpStatus.UNUSED) {
                return false;
            }
            stored.otp().setStatus(OtpStatus.USED);
            return true;
        }
    }

    @Override
    public void markBlocked(String verifyId) {
        StoredOtp stored = otps.get(verifyId);
        if (stored == null || stored.isExpired()) {
            delete(verifyId);
            throw new BusinessException(ErrorCode.OTP_EXPIRED);
        }
        synchronized (stored) {
            stored.otp().setStatus(OtpStatus.BLOCKED);
        }
    }

    @Override
    public void delete(String verifyId) {
        StoredOtp removed = otps.remove(verifyId);
        if (removed != null && removed.otp().getUserId() != null && removed.otp().getType() != null) {
            String mappingKey = userMappingKey(removed.otp().getUserId(), removed.otp().getType());
            userMappings.computeIfPresent(mappingKey, (key, mapping) ->
                    mapping.verifyId().equals(verifyId) ? null : mapping);
        }
    }

    @Override
    public boolean exists(String verifyId) {
        return getOtp(verifyId).isPresent();
    }

    @Override
    public void saveUserMapping(Long userId, OtpType type, String verifyId, Duration ttl) {
        userMappings.put(userMappingKey(userId, type), new StoredMapping(verifyId, Instant.now().plus(ttl)));
    }

    @Override
    public Optional<String> getVerifyIdByUserId(Long userId, OtpType type) {
        String key = userMappingKey(userId, type);
        StoredMapping mapping = userMappings.get(key);
        if (mapping == null) {
            return Optional.empty();
        }
        if (mapping.isExpired()) {
            userMappings.remove(key);
            return Optional.empty();
        }
        return Optional.of(mapping.verifyId());
    }

    @Override
    public void deleteUserMapping(Long userId, OtpType type) {
        userMappings.remove(userMappingKey(userId, type));
    }

    @Override
    public boolean matchesCode(OtpData otp, String rawCode) {
        return passwordEncoder.matches(rawCode, otp.getCodeHash());
    }

    private String userMappingKey(Long userId, OtpType type) {
        return type.name().toLowerCase() + ":" + userId;
    }

    private record StoredOtp(OtpData otp, Instant expiresAt) {
        boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }

    private record StoredMapping(String verifyId, Instant expiresAt) {
        boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }
}
