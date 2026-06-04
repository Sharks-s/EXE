package com.exe101.exe.dto.response;


import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class VerifyRegisterResponse {
    private String sessionToken;
    private Long expiresInSeconds;
}