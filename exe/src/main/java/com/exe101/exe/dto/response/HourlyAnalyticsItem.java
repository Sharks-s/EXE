package com.exe101.exe.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class HourlyAnalyticsItem {
    private Integer hour;
    private Integer focusMinutes;
    private Integer sessions;
}
