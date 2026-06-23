package com.exe101.exe.controller;

import com.exe101.exe.dto.response.AnalyticsSummaryResponse;
import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.dto.response.CalendarAnalyticsResponse;
import com.exe101.exe.dto.response.FocusTimeChartResponse;
import com.exe101.exe.dto.response.GoalAnalyticsResponse;
import com.exe101.exe.dto.response.HourlyAnalyticsResponse;
import com.exe101.exe.dto.response.ViolationAnalyticsResponse;
import com.exe101.exe.model.enums.AnalyticsRange;
import com.exe101.exe.security.CustomUserDetails;
import com.exe101.exe.service.UserAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequiredArgsConstructor
@RequestMapping("/users/me/analytics")
public class UserAnalyticsController {

    private final UserAnalyticsService userAnalyticsService;

    @GetMapping("/summary")
    public ApiResponse<AnalyticsSummaryResponse> getSummary(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "WEEK") AnalyticsRange range,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to
    ) {
        return ApiResponse.success(
                userAnalyticsService.getSummary(userDetails.getId(), range, from, to)
        );
    }

    @GetMapping("/focus-time")
    public ApiResponse<FocusTimeChartResponse> getFocusTime(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "WEEK") AnalyticsRange range,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to
    ) {
        return ApiResponse.success(
                userAnalyticsService.getFocusTime(userDetails.getId(), range, from, to)
        );
    }

    @GetMapping("/hourly")
    public ApiResponse<HourlyAnalyticsResponse> getHourlyAnalytics(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "WEEK") AnalyticsRange range,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to
    ) {
        return ApiResponse.success(
                userAnalyticsService.getHourlyAnalytics(userDetails.getId(), range, from, to)
        );
    }

    @GetMapping("/goals")
    public ApiResponse<GoalAnalyticsResponse> getGoalAnalytics(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "WEEK") AnalyticsRange range,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to
    ) {
        return ApiResponse.success(
                userAnalyticsService.getGoalAnalytics(userDetails.getId(), range, from, to)
        );
    }

    @GetMapping("/violations")
    public ApiResponse<ViolationAnalyticsResponse> getViolationAnalytics(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "WEEK") AnalyticsRange range,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to
    ) {
        return ApiResponse.success(
                userAnalyticsService.getViolationAnalytics(userDetails.getId(), range, from, to)
        );
    }

    @GetMapping("/calendar")
    public ApiResponse<CalendarAnalyticsResponse> getCalendar(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam int year,
            @RequestParam int month
    ) {
        return ApiResponse.success(
                userAnalyticsService.getCalendar(userDetails.getId(), year, month)
        );
    }
}
