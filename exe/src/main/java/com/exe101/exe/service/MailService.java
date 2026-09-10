package com.exe101.exe.service;

public interface MailService {
    void sendRegisterOtp(String toEmail, String otp);
    void sendResetPasswordOtp(String toEmail, String otp);
}
