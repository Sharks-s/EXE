package com.exe101.exe.repository;

import com.exe101.exe.model.entity.OtpRedis;
import com.exe101.exe.model.enums.OtpType;

import java.time.Duration;
import java.util.Optional;

public interface OtpStore {

    void saveOtp(String verifyId, OtpRedis otp, Duration ttl);

    Optional<OtpRedis> getOtp(String verifyId);

    /**
     * Tăng attempts atomic. Nếu đạt maxAttempts, tự động chuyển status sang BLOCKED
     * trong cùng 1 lệnh Lua (không tách thành 2 round-trip riêng).
     *
     * @return attempts mới sau khi tăng
     */
    long recordFailedAttempt(String verifyId, int maxAttempts);

    /**
     * Atomic consume: chỉ chuyển UNUSED -> USED đúng 1 lần.
     * Nếu 2 request cùng verify đúng OTP gần như đồng thời, chỉ 1 request thắng.
     *
     * @return true nếu request này là request thắng cuộc (được phép tiếp tục xử lý)
     */
    boolean consumeOtp(String verifyId);

    void markBlocked(String verifyId);

    void delete(String verifyId);

    boolean exists(String verifyId);

    void saveUserMapping(Long userId, OtpType type, String verifyId, Duration ttl);

    Optional<String> getVerifyIdByUserId(Long userId, OtpType type);

    void deleteUserMapping(Long userId, OtpType type);

    boolean matchesCode(OtpRedis otp, String rawCode);
}
