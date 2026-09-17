package com.exe101.exe.dto.response;

import com.exe101.exe.model.enums.AiCallStatus;
import com.exe101.exe.model.enums.JsonParseStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record AiLogResponse(
        Long id,
        String provider,
        String model,
        String feature,
        String promptName,
        AiCallStatus status,
        JsonParseStatus jsonParseStatus,
        String jsonParseError,
        Integer inputTokens,
        Integer outputTokens,
        Integer totalTokens,
        BigDecimal costUsd,
        Long latencyMs,
        String errorMessage,
        Instant createdAt
) {
}
