package com.exe101.exe.dto.response;

import lombok.Builder;

@Builder
public record CreatePaymentResponse(
        String orderCode,
        String payUrl,      // FE/Tauri mở link này (deeplink ra browser hệ thống với Tauri)
        String deeplink,    // deeplink mở thẳng app MoMo nếu máy có cài (optional, có thể null)
        Long amount
) {
}