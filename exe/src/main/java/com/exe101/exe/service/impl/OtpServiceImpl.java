package com.exe101.exe.service.impl;

import com.exe101.exe.config.OtpProperties;
import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.model.entity.OtpData;
import com.exe101.exe.model.enums.OtpStatus;
import com.exe101.exe.model.enums.OtpType;
import com.exe101.exe.repository.OtpStore;
import com.exe101.exe.service.MailService;
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
    private final MailService mailService;

    @Override
    public String generateOtp(Long userId, String email, OtpType type) {
        // Xóa OTP cũ nếu có
        otpStore.getVerifyIdByUserId(userId, type).ifPresent(oldVerifyId -> {
            otpStore.delete(oldVerifyId);
            otpStore.deleteUserMapping(userId, type);
        });

        String otp = generateNumericOtp();
        String verifyId = UUID.randomUUID().toString();
        Instant now = Instant.now();
        Instant expiredAt = now.plus(otpProperties.getExpireMinutes(), ChronoUnit.MINUTES);
        Duration ttl = Duration.ofMinutes(otpProperties.getExpireMinutes());

        otpStore.saveOtp(verifyId,
                OtpData.builder()
                        .userId(userId)
                        .email(email)
                        .type(type)
                        .code(otp)
                        .attempts(0)
                        .status(OtpStatus.UNUSED)
                        .createdAt(now)
                        .expiredAt(expiredAt)
                        .build(),
                ttl
        );

        otpStore.saveUserMapping(userId, type, verifyId, ttl);

        sendOtpEmail(email, otp, type);
        return verifyId;
    }

    @Override
    public OtpData verifyOtp(String verifyId, String otpInput, OtpType type) {

        OtpData otp = otpStore.getOtp(verifyId)
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

        if (otp.getType() != type) {
            throw new BusinessException(ErrorCode.INVALID_OTP);
        }

        if (!otpStore.matchesCode(otp, otpInput)) {
            long attempts = otpStore.recordFailedAttempt(verifyId, otpProperties.getMaxAttempts());

            if (attempts >= otpProperties.getMaxAttempts()) {
                throw new BusinessException(ErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED);
            }

            throw new BusinessException(ErrorCode.INVALID_OTP);
        }

        boolean consumed = otpStore.consumeOtp(verifyId);
        if (!consumed) {
            throw new BusinessException(ErrorCode.OTP_ALREADY_USED);
        }

        otpStore.delete(verifyId);

        return otp;
    }

    private String generateNumericOtp() {
        int length = otpProperties.getLength();
        if (length < 1 || length > 9) {
            throw new IllegalStateException("OTP length must be between 1 and 9");
        }

        int min = (int) Math.pow(10, length - 1);
        int max = (int) Math.pow(10, length);
        return String.format("%0" + length + "d", ThreadLocalRandom.current().nextInt(min, max));
    }

    private void sendOtpEmail(String email, String otp, OtpType type) {
        if (type == OtpType.RESET_PASSWORD) {
            mailService.sendResetPasswordOtp(email, otp);
            return;
        }

        mailService.sendRegisterOtp(email, otp);
    }
}
