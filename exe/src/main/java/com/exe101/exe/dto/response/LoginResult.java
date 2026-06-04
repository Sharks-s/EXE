package com.exe101.exe.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class LoginResult {
    private LoginResponse loginResponse;
    private String refreshToken;
}