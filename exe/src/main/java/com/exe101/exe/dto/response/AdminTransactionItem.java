package com.exe101.exe.dto.response;

import com.exe101.exe.model.enums.PaymentProvider;
import com.exe101.exe.model.enums.TransactionStatus;

import java.time.Instant;

public record AdminTransactionItem(
        Long id,
        Long userId,
        String userEmail,
        String userFullName,
        String orderCode,
        String plan,
        Long amount,
        PaymentProvider provider,
        TransactionStatus status,
        String providerTransactionId,
        Long subscriptionId,
        Instant paidAt,
        Instant createdAt,
        Instant updatedAt
) {
}
