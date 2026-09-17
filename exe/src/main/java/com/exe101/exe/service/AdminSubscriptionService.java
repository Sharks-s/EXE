package com.exe101.exe.service;

import com.exe101.exe.dto.response.AdminActiveSubscriptionItem;
import com.exe101.exe.dto.response.AdminSubscriptionStatsResponse;
import com.exe101.exe.dto.response.AdminTransactionItem;
import com.exe101.exe.dto.response.PagedResponse;
import com.exe101.exe.model.enums.PaymentProvider;
import com.exe101.exe.model.enums.TransactionStatus;

import java.time.Instant;

public interface AdminSubscriptionService {
    AdminSubscriptionStatsResponse getStats(int days);

    PagedResponse<AdminActiveSubscriptionItem> getActiveSubscriptions(String keyword, int page, int size);

    PagedResponse<AdminTransactionItem> getTransactions(
            String keyword,
            TransactionStatus status,
            PaymentProvider provider,
            Instant from,
            Instant to,
            int page,
            int size
    );
}
