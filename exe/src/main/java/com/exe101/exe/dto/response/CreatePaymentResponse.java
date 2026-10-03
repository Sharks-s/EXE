package com.exe101.exe.dto.response;

import lombok.Builder;

@Builder
public record CreatePaymentResponse(
        String orderCode,
        String checkoutUrl,
        String payUrl,
        String deeplink,
        Long amount
) {
}
