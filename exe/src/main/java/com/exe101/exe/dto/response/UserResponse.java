package com.exe101.exe.dto.response;

import com.exe101.exe.model.enums.UserStatus;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Long id;
    private String fullName;
    private String email;
    private UserStatus status;
    private Instant createdAt;
}