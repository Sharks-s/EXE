package com.exe101.exe.dto.response;

import java.time.LocalDate;
import java.util.List;

public record SystemAnalyticsResponse(
        Summary summary,
        List<HourlyStudy> hourlyStudy,
        List<RetentionPoint> retention,
        List<CompletionTrendPoint> completionTrend
) {
    public record Summary(
            long totalUsers,
            long activeUsers,
            long startedSessions,
            long completedSessions,
            double completionRate,
            double retentionRate,
            double avgSessionMinutes
    ) {
    }

    public record HourlyStudy(
            int hour,
            long users,
            long sessions,
            int focusMinutes
    ) {
    }

    public record RetentionPoint(
            String cohort,
            long cohortUsers,
            long retainedUsers,
            double retentionRate
    ) {
    }

    public record CompletionTrendPoint(
            LocalDate date,
            long started,
            long completed,
            double rate
    ) {
    }
}
