package com.exe101.exe.model.entity;

import lombok.Builder;
import lombok.Getter;
import java.time.Instant;

@Getter
@Builder
public class RegisterSession {
    private Long userId;
    private String email;
    private Instant expiresAt;
}
