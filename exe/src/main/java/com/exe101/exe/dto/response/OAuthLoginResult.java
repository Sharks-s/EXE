package com.exe101.exe.dto.response;

import lombok.*;


@Getter
@AllArgsConstructor
public class OAuthLoginResult {
    private String accessToken;
    private String refreshToken;
    private boolean isNewUser;
}