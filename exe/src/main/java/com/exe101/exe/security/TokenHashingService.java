package com.exe101.exe.security;

import com.exe101.exe.config.JwtProperties;
import lombok.RequiredArgsConstructor;
import org.apache.commons.codec.digest.HmacUtils;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TokenHashingService {
    private final JwtProperties jwtProperties;

    public String hash(String token) {
        return HmacUtils.hmacSha256Hex(jwtProperties.getRefreshHashSecret(), token);
    }
}