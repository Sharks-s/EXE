package com.exe101.exe.repository;

import com.exe101.exe.model.entity.OtpData;
import com.exe101.exe.model.enums.OtpType;

import java.time.Duration;
import java.util.Optional;

public interface OtpStore {

    void saveOtp(String verifyId, OtpData otp, Duration ttl);

    Optional<OtpData> getOtp(String verifyId);

    long recordFailedAttempt(String verifyId, int maxAttempts);

    boolean consumeOtp(String verifyId);

    void markBlocked(String verifyId);

    void delete(String verifyId);

    boolean exists(String verifyId);

    void saveUserMapping(Long userId, OtpType type, String verifyId, Duration ttl);

    Optional<String> getVerifyIdByUserId(Long userId, OtpType type);

    void deleteUserMapping(Long userId, OtpType type);

    boolean matchesCode(OtpData otp, String rawCode);
}
