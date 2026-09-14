package com.exe101.exe.dto.response;

import com.exe101.exe.model.enums.PointTransactionType;

import java.time.Instant;

public record PointTransactionResponse(
        Long id,
        Integer amount,
        PointTransactionType type,
        String reason,
        String referenceId,
        Instant createdAt
) {
}
