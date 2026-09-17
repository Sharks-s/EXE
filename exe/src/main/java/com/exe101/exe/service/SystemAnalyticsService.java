package com.exe101.exe.service;

import com.exe101.exe.dto.response.SystemAnalyticsResponse;

public interface SystemAnalyticsService {
    SystemAnalyticsResponse getSystemAnalytics(int days);
}
