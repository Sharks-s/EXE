package com.exe101.exe.event;

import java.time.Instant;

public record SessionCompletedEvent(
        Long sessionId,
        Long userId,
        Integer earnedPoints,
        Instant completedAt
) {
}
