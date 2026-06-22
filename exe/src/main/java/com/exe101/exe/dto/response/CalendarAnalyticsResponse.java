package com.exe101.exe.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class CalendarAnalyticsResponse {
    private Integer year;
    private Integer month;
    private List<CalendarAnalyticsItem> items;
}
