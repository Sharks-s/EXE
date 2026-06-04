package com.exe101.exe.service.impl;

import com.exe101.exe.config.JwtProperties;
import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.model.entity.RefreshToken;
import com.exe101.exe.repository.RefreshTokenRepository;
import com.exe101.exe.security.JwtTokenProvider;
import com.exe101.exe.security.TokenHashingService;
import com.exe101.exe.service.RefreshTokenService;
import com.exe101.exe.service.result.TokenPair;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class RefreshTokenServiceImpl implements RefreshTokenService {

    private static final long GRACE_PERIOD_MS = 5_000;

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtProperties jwtProperties;
    private final TokenHashingService tokenHashingService;

    @Override
    @Transactional
    public TokenPair refresh(String rawRefreshToken) {

        if (!jwtTokenProvider.validateRefreshToken(rawRefreshToken)) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_INVALID);
        }

        String hash = tokenHashingService.hash(rawRefreshToken);
        String deviceId = jwtTokenProvider.getDeviceId(rawRefreshToken);
        Long userId = jwtTokenProvider.getUserId(rawRefreshToken);

        RefreshToken current = refreshTokenRepository.findByToken(hash)
                .orElseThrow(() -> new BusinessException(ErrorCode.REFRESH_TOKEN_NOT_FOUND));

        if (current.isExpired()) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        // -------- REVOKED --------
        if (current.isRevoked()) {
            boolean inGrace = current.getCreatedAt()
                    .plusMillis(GRACE_PERIOD_MS)
                    .isAfter(Instant.now());

            if (inGrace) {
                // race condition (multi-tab)
                RefreshToken latest = refreshTokenRepository
                        .findLatestByDeviceId(deviceId)
                        .orElseThrow(() -> new BusinessException(ErrorCode.REFRESH_TOKEN_REUSED));

                return TokenPair.builder()
                        .accessToken(jwtTokenProvider.generateAccessToken(userId))
                        .refreshToken(null) // client đã có RT mới
                        .build();
            }

            // reuse thật
            refreshTokenRepository.revokeAllByDeviceId(deviceId);
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_REUSED);
        }

        // -------- ROTATION HỢP LỆ --------
        current.revoke();

        String newAccessToken = jwtTokenProvider.generateAccessToken(userId);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(userId, deviceId);

        RefreshToken newEntity = RefreshToken.builder()
                .token(tokenHashingService.hash(newRefreshToken))
                .userId(userId)
                .jti(jwtTokenProvider.getJti(newRefreshToken))
                .deviceId(deviceId)
                .expiresAt(
                        Instant.now().plusMillis(jwtProperties.getRefreshExpirationMs())
                )
                .build();

        refreshTokenRepository.save(newEntity);

        return TokenPair.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .build();
    }


    @Override
    @Transactional
    public void create(Long userId, String rawRefreshToken, String deviceId) {

        RefreshToken token = RefreshToken.builder()
                .userId(userId)
                .token(tokenHashingService.hash(rawRefreshToken))
                .jti(jwtTokenProvider.getJti(rawRefreshToken))
                .deviceId(deviceId)
                .expiresAt(
                        Instant.now().plusMillis(jwtProperties.getRefreshExpirationMs())
                )
                .build();

        refreshTokenRepository.save(token);
    }

    @Override
    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken == null) return;

        String hash = tokenHashingService.hash(rawRefreshToken);

        refreshTokenRepository.findByToken(hash)
                .ifPresent(token -> {
                    if (!token.isRevoked()) {
                        token.revoke();
                        refreshTokenRepository.save(token);
                    }
                });
    }

    @Override
    public RefreshToken verify(String rawRefreshToken) {

        if (rawRefreshToken == null) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_MISSING);
        }

        if (!jwtTokenProvider.validateRefreshToken(rawRefreshToken)) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_INVALID);
        }

        String hash = tokenHashingService.hash(rawRefreshToken);

        RefreshToken token = refreshTokenRepository.findByToken(hash)
                .orElseThrow(() -> new BusinessException(ErrorCode.REFRESH_TOKEN_NOT_FOUND));

        if (token.isRevoked()) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_REVOKED);
        }

        if (token.isExpired()) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        return token;
    }

    @Override
    @Transactional
    public void revokeByDevice(String deviceId) {
        refreshTokenRepository.revokeAllByDeviceId(deviceId);
    }
}