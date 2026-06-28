package com.exe101.exe.model.entity;

import com.exe101.exe.model.enums.OtpType;
import lombok.Builder;
import lombok.Getter;
import java.time.Instant;

@Getter
@Builder
public class RegisterSession {
    private Long userId;
    private String email;
    private OtpType type;
    private Instant expiresAt;
}
