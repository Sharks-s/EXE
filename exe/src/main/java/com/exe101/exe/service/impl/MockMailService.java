package com.exe101.exe.service.impl;

import com.exe101.exe.service.MailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@Profile("mock-mail")
public class MockMailService implements MailService {
    @Override
    public void sendRegisterOtp(String toEmail, String otp) {
        log.info("========== MOCK MAIL ==========");
        log.info("To: {}", toEmail);
        log.info("Register OTP: {}", otp);
        log.info("================================");
    }

    @Override
    public void sendResetPasswordOtp(String toEmail, String otp) {
        log.info("========== MOCK MAIL ==========");
        log.info("To: {}", toEmail);
        log.info("Reset password OTP: {}", otp);
        log.info("================================");
    }
}
