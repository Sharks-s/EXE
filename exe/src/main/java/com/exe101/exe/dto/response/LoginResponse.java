package com.exe101.exe.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class LoginResponse {
    private String accessToken;

    @Builder.Default
    private String tokenType = "Bearer";

    private UserSummary user;
}