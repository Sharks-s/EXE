package com.exe101.exe.controller;

import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.dto.response.SystemAnalyticsResponse;
import com.exe101.exe.service.SystemAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/analytics")
@RequiredArgsConstructor
public class AdminAnalyticsController {

    private final SystemAnalyticsService systemAnalyticsService;

    @GetMapping("/system")
    public ApiResponse<SystemAnalyticsResponse> getSystemAnalytics(@RequestParam(defaultValue = "30") int days) {
        return ApiResponse.success(systemAnalyticsService.getSystemAnalytics(days));
    }
}
