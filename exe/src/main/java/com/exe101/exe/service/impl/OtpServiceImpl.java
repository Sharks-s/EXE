package com.exe101.exe.service.impl;

import com.exe101.exe.config.OtpProperties;
import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.model.entity.OtpRedis;
import com.exe101.exe.model.enums.OtpStatus;
import com.exe101.exe.repository.OtpStore;
import com.exe101.exe.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class OtpServiceImpl implements OtpService {

    private final OtpStore otpStore;
    private final OtpProperties otpProperties;
    private final MockMailService mockMailService;

    public String generateRegisterOtp(Long userId, String email) {
        // Xóa OTP cũ nếu có
        otpStore.getVerifyIdByUserId(userId).ifPresent(oldVerifyId -> {
            otpStore.delete(oldVerifyId);
            otpStore.deleteUserMapping(userId);
        });

        String otp = String.format("%06d",
                ThreadLocalRandom.current().nextInt(100_000, 1_000_000));
        String verifyId = UUID.randomUUID().toString();
        Instant now = Instant.now();
        Instant expiredAt = now.plus(otpProperties.getExpireMinutes(), ChronoUnit.MINUTES);
        Duration ttl = Duration.ofMinutes(otpProperties.getExpireMinutes());

        otpStore.saveRegisterOtp(verifyId,
                OtpRedis.builder()
                        .userId(userId)
                        .email(email)
                        .code(otp)
                        .attempts(0)
                        .status(OtpStatus.UNUSED)
                        .createdAt(now)
                        .expiredAt(expiredAt)
                        .build(),
                ttl
        );

        otpStore.saveUserMapping(userId, verifyId, ttl);

        mockMailService.sendRegisterOtp(email, otp);
        return verifyId;
    }

    @Override
    public OtpRedis verifyRegisterOtp(String verifyId, String otpInput) {

        OtpRedis otp = otpStore.getRegisterOtp(verifyId)
                .orElseThrow(() -> new BusinessException(ErrorCode.OTP_NOT_FOUND));

        if (otp.getExpiredAt().isBefore(Instant.now())) {
            otpStore.delete(verifyId);
            throw new BusinessException(ErrorCode.OTP_EXPIRED);
        }

        if (otp.getStatus() == OtpStatus.BLOCKED) {
            throw new BusinessException(ErrorCode.OTP_BLOCKED);
        }

        if (otp.getStatus() == OtpStatus.USED) {
            throw new BusinessException(ErrorCode.OTP_ALREADY_USED);
        }

        if (!otpStore.matchesCode(otp, otpInput)) {
            // recordFailedAttempt tự kiểm tra BLOCKED + tăng attempts + tự set BLOCKED nếu vượt ngưỡng,
            // tất cả trong 1 lệnh Lua atomic
            long attempts = otpStore.recordFailedAttempt(verifyId, otpProperties.getMaxAttempts());

            if (attempts >= otpProperties.getMaxAttempts()) {
                throw new BusinessException(ErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED);
            }

            throw new BusinessException(ErrorCode.INVALID_OTP);
        }

        // Atomic consume: chỉ 1 trong nhiều request đồng thời được phép thắng.
        // Nếu request này thua (request khác đã consume trước), trả lỗi thay vì tiếp tục xử lý
        // (tránh tạo 2 session/activate account 2 lần khi user double-submit).
        boolean consumed = otpStore.consumeRegisterOtp(verifyId);
        if (!consumed) {
            throw new BusinessException(ErrorCode.OTP_ALREADY_USED);
        }

        otpStore.delete(verifyId);

        return otp;
    }
}