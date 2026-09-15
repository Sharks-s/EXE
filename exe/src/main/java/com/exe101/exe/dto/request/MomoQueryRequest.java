package com.exe101.exe.dto.request;

import lombok.Builder;

@Builder
public record MomoQueryRequest(
        String partnerCode,
        String requestId,
        String orderId,
        String signature,
        String lang
) {
}