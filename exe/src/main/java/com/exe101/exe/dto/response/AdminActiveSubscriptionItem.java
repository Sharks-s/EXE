package com.exe101.exe.dto.response;

import java.time.Instant;

public record AdminActiveSubscriptionItem(
        Long id,
        Long userId,
        String userEmail,
        String userFullName,
        String plan,
        String billingCycle,
        Instant startedAt,
        Instant expiresAt,
        boolean active,
        Instant createdAt
) {
}
