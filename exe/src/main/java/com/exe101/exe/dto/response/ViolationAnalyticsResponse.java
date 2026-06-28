package com.exe101.exe.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ViolationAnalyticsResponse {
    private Integer totalViolations;
    private Integer penaltyMinutes;
    private List<ViolationTypeAnalyticsItem> byType;
    private List<TopViolationAppItem> topApps;
}
