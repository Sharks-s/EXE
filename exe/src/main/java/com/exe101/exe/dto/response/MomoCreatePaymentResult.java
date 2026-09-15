package com.exe101.exe.dto.response;

public record MomoCreatePaymentResult(
        String partnerCode,
        String orderId,
        String requestId,
        Long amount,
        Long responseTime,
        String message,
        Integer resultCode,
        String payUrl,
        String deeplink,
        String qrCodeUrl
) {
}
