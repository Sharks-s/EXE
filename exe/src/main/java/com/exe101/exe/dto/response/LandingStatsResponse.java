package com.exe101.exe.dto.response;

public record LandingStatsResponse(
        long totalFocusMinutes,
        long completedSessions,
        double completionRate,
        long raisedBuddies
) {
}
