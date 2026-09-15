package com.exe101.exe.dto.response;

import com.exe101.exe.model.enums.TransactionStatus;
import lombok.Builder;

@Builder
public record TransactionStatusResponse(
        String orderCode,
        TransactionStatus status,
        String plan,
        Long amount
) {
}