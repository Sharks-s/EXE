package com.exe101.exe.dto.response;

import com.exe101.exe.model.enums.UserStatus;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
public class AdminUserListItem {

    private Long id;
    private String email;
    private String fullName;
    private String avatarUrl;
    private UserStatus status;
    private boolean isPremium;
    private String role;
    private Instant lastLoginAt;
    private Instant createdAt;

    public AdminUserListItem(
            Long id,
            String email,
            String fullName,
            String avatarUrl,
            UserStatus status,
            String role,
            Instant lastLoginAt,
            Instant createdAt
    ) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.avatarUrl = avatarUrl;
        this.status = status;
        this.role = role;
        this.lastLoginAt = lastLoginAt;
        this.createdAt = createdAt;
    }
}