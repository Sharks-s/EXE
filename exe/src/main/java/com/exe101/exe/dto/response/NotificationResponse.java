package com.exe101.exe.dto.response;

import com.exe101.exe.model.enums.NotificationType;

import java.time.Instant;
import java.util.Map;

public record NotificationResponse(
        Long id,
        NotificationType type,
        String title,
        String message,
        boolean read,
        String actionUrl,
        Map<String, Object> metadata,
        Instant createdAt,
        Instant readAt
) {
}
