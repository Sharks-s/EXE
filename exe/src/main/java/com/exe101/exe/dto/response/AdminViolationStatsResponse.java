package com.exe101.exe.dto.response;

import com.exe101.exe.model.enums.ViolationType;

import java.util.List;

public record AdminViolationStatsResponse(
        List<TopViolator> topViolators,
        List<TopApp> topApps,
        List<TypeCount> byType
) {
    public record TopViolator(Long userId, String email, String fullName, long violationCount) {}
    public record TopApp(String appName, long violationCount) {}
    public record TypeCount(ViolationType type, long count) {}
}