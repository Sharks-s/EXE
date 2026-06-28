package com.exe101.exe.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class GoalAnalyticsResponse {
    private List<GoalAnalyticsItem> items;
}
