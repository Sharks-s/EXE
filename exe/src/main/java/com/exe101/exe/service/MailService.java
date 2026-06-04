package com.exe101.exe.service;

public interface MailService {
    void sendRegisterOtp(String toEmail, String otp);
}