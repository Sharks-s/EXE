package com.exe101.exe.service;

import com.exe101.exe.dto.request.CreatePaymentRequest;
import com.exe101.exe.dto.request.MomoIpnRequest;
import com.exe101.exe.dto.request.SePayIpnRequest;
import com.exe101.exe.dto.response.CreatePaymentResponse;
import com.exe101.exe.dto.response.TransactionStatusResponse;

public interface PaymentService {

    CreatePaymentResponse createMomoPayment(CreatePaymentRequest request, Long userId);

    void handleMomoIpn(MomoIpnRequest ipnRequest);

    CreatePaymentResponse createSePayPayment(CreatePaymentRequest request, Long userId);

    String buildSePayCheckoutForm(String orderCode);

    void handleSePayIpn(String secretKey, SePayIpnRequest ipnRequest);

    TransactionStatusResponse getTransactionStatus(String orderCode, Long userId);

    void reconcilePendingTransaction(String orderCode);
}
