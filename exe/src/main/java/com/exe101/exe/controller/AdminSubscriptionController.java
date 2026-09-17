package com.exe101.exe.controller;

import com.exe101.exe.dto.response.AdminActiveSubscriptionItem;
import com.exe101.exe.dto.response.AdminSubscriptionStatsResponse;
import com.exe101.exe.dto.response.AdminTransactionItem;
import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.dto.response.PagedResponse;
import com.exe101.exe.model.enums.PaymentProvider;
import com.exe101.exe.model.enums.TransactionStatus;
import com.exe101.exe.service.AdminSubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/admin/subscriptions")
@RequiredArgsConstructor
public class AdminSubscriptionController {

    private final AdminSubscriptionService adminSubscriptionService;

    @GetMapping("/stats")
    public ApiResponse<AdminSubscriptionStatsResponse> getStats(
            @RequestParam(defaultValue = "30") int days
    ) {
        return ApiResponse.success(adminSubscriptionService.getStats(days));
    }

    @GetMapping("/active")
    public ApiResponse<PagedResponse<AdminActiveSubscriptionItem>> getActiveSubscriptions(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.success(adminSubscriptionService.getActiveSubscriptions(keyword, page, size));
    }

    @GetMapping("/transactions")
    public ApiResponse<PagedResponse<AdminTransactionItem>> getTransactions(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) TransactionStatus status,
            @RequestParam(required = false) PaymentProvider provider,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        return ApiResponse.success(adminSubscriptionService.getTransactions(
                keyword,
                status,
                provider,
                from,
                to,
                page,
                size
        ));
    }
}
