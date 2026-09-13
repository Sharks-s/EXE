package com.exe101.exe.dto.response;

import com.exe101.exe.model.enums.UserStatus;
import java.time.Instant;

public record AdminUserListItem(
        Long id,
        String email,
        String fullName,
        String avatarUrl,
        UserStatus status,
        boolean isPremium,
        Instant lastLoginAt,
        Instant createdAt
) {
}