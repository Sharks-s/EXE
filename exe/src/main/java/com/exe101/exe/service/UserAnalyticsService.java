package com.exe101.exe.service;

import com.exe101.exe.dto.response.AnalyticsSummaryResponse;
import com.exe101.exe.dto.response.CalendarAnalyticsResponse;
import com.exe101.exe.dto.response.FocusTimeChartResponse;
import com.exe101.exe.dto.response.GoalAnalyticsResponse;
import com.exe101.exe.dto.response.HourlyAnalyticsResponse;
import com.exe101.exe.dto.response.ViolationAnalyticsResponse;
import com.exe101.exe.model.enums.AnalyticsRange;

import java.time.LocalDate;

public interface UserAnalyticsService {
    AnalyticsSummaryResponse getSummary(Long userId, AnalyticsRange range, LocalDate from, LocalDate to);

    FocusTimeChartResponse getFocusTime(Long userId, AnalyticsRange range, LocalDate from, LocalDate to);

    HourlyAnalyticsResponse getHourlyAnalytics(Long userId, AnalyticsRange range, LocalDate from, LocalDate to);

    GoalAnalyticsResponse getGoalAnalytics(Long userId, AnalyticsRange range, LocalDate from, LocalDate to);

    ViolationAnalyticsResponse getViolationAnalytics(Long userId, AnalyticsRange range, LocalDate from, LocalDate to);

    CalendarAnalyticsResponse getCalendar(Long userId, int year, int month);
}
