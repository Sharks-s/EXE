package com.exe101.exe.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class RefreshTokenResponse {
    private String accessToken;

    @JsonIgnore
    private String refreshToken;
}