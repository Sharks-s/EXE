package com.exe101.exe.service.result;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Builder
public class TokenPair {
    private final String accessToken;
    private final String refreshToken;
}