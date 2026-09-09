package com.exe101.exe.service;


import com.exe101.exe.model.entity.OtpRedis;
import com.exe101.exe.model.enums.OtpType;

public interface OtpService {
    String generateOtp(Long userId, String email, OtpType type);
    OtpRedis verifyOtp(String verifyId, String otpInput, OtpType type);
}
