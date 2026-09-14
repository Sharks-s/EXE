package com.exe101.exe.dto.response;

import java.time.Instant;

public record AdminSessionMonitorItem(
        Long id,
        Long userId,
        String userEmail,
        String userFullName,
        String goal,
        Integer plannedDuration,     // phút
        Instant startedAt,
        Instant lastHeartbeatAt,
        String personalityCode,
        String petName,
        boolean isPaused
) {}