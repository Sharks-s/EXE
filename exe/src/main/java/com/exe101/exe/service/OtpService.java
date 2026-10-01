package com.exe101.exe.service;


import com.exe101.exe.model.entity.OtpData;
import com.exe101.exe.model.enums.OtpType;

public interface OtpService {
    String generateOtp(Long userId, String email, OtpType type);
    OtpData verifyOtp(String verifyId, String otpInput, OtpType type);
}
