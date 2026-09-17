package com.exe101.exe.dto.response;

public record AdminSubscriptionStatsResponse(
        long activePremium,
        long monthlyActive,
        long yearlyActive,
        long revenuePaidVnd,
        long paidTransactions
) {
}
