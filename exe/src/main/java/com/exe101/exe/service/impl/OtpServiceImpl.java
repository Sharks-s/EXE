package com.exe101.exe.service.impl;

import com.exe101.exe.config.OtpProperties;
import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.model.entity.OtpRedis;
import com.exe101.exe.model.enums.OtpStatus;
import com.exe101.exe.model.enums.OtpType;
import com.exe101.exe.repository.OtpStore;
import com.exe101.exe.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Set;
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

        // Lưu mapping userId → verifyId để lần sau tìm được
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

        if (!otpInput.equals(otp.getCode())) {
            long attempts = otpStore.increaseAttempts(verifyId);

            if (attempts >= otpProperties.getMaxAttempts()) {
                otpStore.markBlocked(verifyId);
                throw new BusinessException(ErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED);
            }

            throw new BusinessException(ErrorCode.INVALID_OTP);
        }


        otpStore.markUsed(verifyId);
        otpStore.delete(verifyId);

        return otp;
    }

}