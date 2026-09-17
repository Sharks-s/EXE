package com.exe101.exe.dto.response;

import java.util.List;

public record AiLogStatsResponse(
        int days,
        long totalCalls,
        long successCalls,
        long failedCalls,
        long jsonParseSuccess,
        long jsonParseFailed,
        long notJson,
        List<FeatureCount> byFeature
) {
    public record FeatureCount(
            String feature,
            long count
    ) {
    }
}
