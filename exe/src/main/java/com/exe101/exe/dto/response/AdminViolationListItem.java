package com.exe101.exe.dto.response;

import com.exe101.exe.model.enums.ViolationType;

import java.time.Instant;

public record AdminViolationListItem(
        Long id,
        Long userId,
        String userEmail,
        String userFullName,
        ViolationType type,
        String appName,
        String windowTitle,
        int minutesDeducted,
        Instant occurredAt
) {}