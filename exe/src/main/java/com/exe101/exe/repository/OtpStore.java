package com.exe101.exe.repository;


import com.exe101.exe.model.entity.OtpRedis;

import java.time.Duration;
import java.util.Optional;

public interface OtpStore {

    void saveRegisterOtp(String verifyId, OtpRedis data, Duration ttl);

    Optional<OtpRedis> getRegisterOtp(String verifyId);

    long increaseAttempts(String verifyId);

    void markBlocked(String verifyId);

    void markUsed(String verifyId);

    void delete(String verifyId);

    boolean exists(String verifyId);

    void saveUserMapping(Long userId, String verifyId, Duration ttl);

    Optional<String> getVerifyIdByUserId(Long userId);

    void deleteUserMapping(Long userId);
}
