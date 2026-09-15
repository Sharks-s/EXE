package com.exe101.exe.dto.response;

public record MomoQueryResult(
        String partnerCode,
        String requestId,
        String orderId,
        String extraData,
        Long amount,
        Long transId,
        String payType,
        Integer resultCode,
        String message,
        Long responseTime
) {
}