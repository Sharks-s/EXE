package com.exe101.exe.service;


import com.exe101.exe.model.entity.OtpRedis;
import com.exe101.exe.model.enums.OtpType;

public interface OtpService {
    String generateRegisterOtp(Long userId, String email);
    OtpRedis verifyRegisterOtp(String verifyId, String otpInput);
}