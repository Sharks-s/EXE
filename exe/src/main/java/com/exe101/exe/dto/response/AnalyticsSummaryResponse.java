package com.exe101.exe.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AnalyticsSummaryResponse {
    private Integer totalFocusMinutes;
    private Double totalFocusHours;
    private Integer totalSessions;
    private Integer completedSessions;
    private Integer abortedSessions;
    private Integer cancelledSessions;
    private Double completionRate;
    private Double averageSessionMinutes;
    private Integer totalBreakMinutes;
    private Integer totalViolations;
    private Integer currentStreakDays;
    private Integer longestStreakDays;
    private AnalyticsComparisonResponse compareWithPreviousRange;
}
