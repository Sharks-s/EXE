package com.exe101.exe.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class HourlyAnalyticsResponse {
    private List<HourlyAnalyticsItem> items;
    private Integer bestHour;
}
