package com.exe101.exe.dto.request;

import lombok.Builder;

@Builder
public record MomoCreatePaymentRequest(
        String partnerCode,
        String partnerName,
        String storeId,
        String requestId,
        Long amount,
        String orderId,
        String orderInfo,
        String redirectUrl,
        String ipnUrl,
        String requestType,
        String extraData,
        String signature,
        String lang
) {
}
