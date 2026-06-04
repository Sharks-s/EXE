package com.exe101.exe.security;

import com.exe101.exe.config.JwtProperties;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtTokenProvider {
    private final JwtProperties jwtProperties;

    // Secret keys
    private SecretKey getAccessSigningKey() {
        return Keys.hmacShaKeyFor(jwtProperties.getAccessSecret().getBytes(StandardCharsets.UTF_8));
    }

    private SecretKey getRefreshSigningKey() {
        return Keys.hmacShaKeyFor(jwtProperties.getRefreshSecret().getBytes(StandardCharsets.UTF_8));
    }

    // Generate
    public String generateAccessToken(Long userId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtProperties.getAccessExpirationMs());

        return Jwts.builder()
                .setSubject(userId.toString())
                .setId(UUID.randomUUID().toString()) // jti
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(getAccessSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateRefreshToken(Long userId, String deviceId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtProperties.getRefreshExpirationMs());

        return Jwts.builder()
                .setSubject(userId.toString())
                .setId(UUID.randomUUID().toString())   // jti
                .claim("deviceId", deviceId)           // device/session
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(getRefreshSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }


    // Validate
    public boolean validateAccessToken(String token) {
        return validate(token, getAccessSigningKey());
    }

    public boolean validateRefreshToken(String token) {
        return validate(token, getRefreshSigningKey());
    }

    private boolean validate(String token, SecretKey key) {
        try {
            Jwts.parser()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("Token expired");
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid token: {}", e.getMessage());
        }
        return false;
    }

    // PRIVATE generic extractor
    private Long getUserId(String token, SecretKey key) {
        Claims claims = Jwts.parser()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
        return Long.parseLong(claims.getSubject());
    }

    // PUBLIC wrappers for consumers (filter, controllers)
    public Long getUserIdFromAccessToken(String token) {
        return getUserId(token, getAccessSigningKey());
    }

    public Long getUserIdFromRefreshToken(String token) {
        return getUserId(token, getRefreshSigningKey());
    }

    private Claims getClaims(String token, SecretKey key) {
        return Jwts.parser()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String getJti(String refreshToken) {
        return getClaims(refreshToken, getRefreshSigningKey()).getId();
    }

    public String getDeviceId(String refreshToken) {
        return getClaims(refreshToken, getRefreshSigningKey())
                .get("deviceId", String.class);
    }

    public Long getUserId(String refreshToken) {
        return Long.parseLong(
                getClaims(refreshToken, getRefreshSigningKey()).getSubject()
        );
    }
}