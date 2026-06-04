package com.exe101.exe.dto.response;

import com.exe101.exe.model.enums.RegisterStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class RegisterResponse {
    private String email;
    private RegisterStatus status;
    private Long expiresInSeconds ;
    private String verifyId;
}