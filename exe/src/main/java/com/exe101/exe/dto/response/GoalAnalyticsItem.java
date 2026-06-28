package com.exe101.exe.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GoalAnalyticsItem {
    private String goal;
    private Integer focusMinutes;
    private Integer sessions;
    private Double completionRate;
}
