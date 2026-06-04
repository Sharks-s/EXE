package com.exe101.exe.dto.response;

import lombok.*;


@Getter
@AllArgsConstructor
public class OAuthLoginResult {

    private final String accessToken;
    private final String refreshToken;
}