package com.exe101.exe.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SePayIpnRequest(
        Long timestamp,
        @JsonProperty("notification_type")
        String notificationType,
        Order order,
        Transaction transaction
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Order(
            @JsonProperty("order_status")
            String orderStatus,
            @JsonProperty("order_currency")
            String orderCurrency,
            @JsonProperty("order_amount")
            String orderAmount,
            @JsonProperty("order_invoice_number")
            String orderInvoiceNumber
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Transaction(
            @JsonProperty("transaction_id")
            String transactionId,
            @JsonProperty("transaction_status")
            String transactionStatus,
            @JsonProperty("transaction_amount")
            String transactionAmount,
            @JsonProperty("transaction_currency")
            String transactionCurrency
    ) {
    }
}
