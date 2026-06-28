package com.exe101.exe.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AnalyticsComparisonResponse {
    private Integer focusMinutesDiff;
    private Double focusMinutesPercent;
    private Integer sessionsDiff;
    private Integer violationsDiff;
}
