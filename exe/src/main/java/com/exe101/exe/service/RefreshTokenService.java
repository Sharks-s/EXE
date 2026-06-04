package com.exe101.exe.service;


import com.exe101.exe.model.entity.RefreshToken;
import com.exe101.exe.service.result.TokenPair;


public interface RefreshTokenService {
    TokenPair refresh(String token);

    void create(Long userId, String refreshToken, String deviceId);

    void logout(String refreshToken);

    RefreshToken verify(String refreshToken);

    void revokeByDevice(String deviceId);
}
