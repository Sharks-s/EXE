package com.exe101.exe.controller;

import com.exe101.exe.dto.request.CreatePaymentRequest;
import com.exe101.exe.dto.request.MomoIpnRequest;
import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.dto.response.CreatePaymentResponse;
import com.exe101.exe.dto.response.TransactionStatusResponse;
import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.security.CustomUserDetails;
import com.exe101.exe.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@Slf4j
@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    // Các lỗi đã được xử lý DỨT ĐIỂM (terminal) — retry của MoMo cũng không giúp gì thêm,
    // nên trả 204 để MoMo dừng gọi lại. Khác với lỗi hạ tầng bất ngờ (DB timeout...)
    // cần để rơi xuống 5xx cho MoMo tự động retry.
    private static final Set<ErrorCode> TERMINAL_IPN_ERRORS = Set.of(
            ErrorCode.MOMO_SIGNATURE_INVALID,
            ErrorCode.MOMO_IPN_INVALID,
            ErrorCode.TRANSACTION_NOT_FOUND
    );

    @PostMapping("/momo/create")
    public ApiResponse<CreatePaymentResponse> createMomoPayment(
            @Valid @RequestBody CreatePaymentRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        CreatePaymentResponse response = paymentService.createMomoPayment(request, userDetails.getId());
        return ApiResponse.success(response);
    }

    // MoMo gọi endpoint này server-to-server, không có JWT -> đã permitAll trong SecurityConfig.
    // Bắt buộc trả HTTP 204 No Content trong vòng 15s theo đúng contract của MoMo.
    @PostMapping("/momo/ipn")
    public ResponseEntity<Void> handleMomoIpn(@RequestBody MomoIpnRequest request) {
        try {
            paymentService.handleMomoIpn(request);
            return ResponseEntity.noContent().build();
        } catch (BusinessException e) {
            if (TERMINAL_IPN_ERRORS.contains(e.getErrorCode())) {
                log.warn("[Momo IPN] Terminal error, orderId={}, code={}",
                        request.orderId(), e.getErrorCode());
                return ResponseEntity.noContent().build();
            }
            // Lỗi business khác không nằm trong danh sách terminal -> để MoMo retry
            log.error("[Momo IPN] Unexpected business error, orderId={}", request.orderId(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception e) {
            // Lỗi hạ tầng bất ngờ (DB, NPE...) -> để MoMo retry
            log.error("[Momo IPN] Unexpected error, orderId={}", request.orderId(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{orderCode}/status")
    public ApiResponse<TransactionStatusResponse> getTransactionStatus(
            @PathVariable String orderCode,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success(paymentService.getTransactionStatus(orderCode, userDetails.getId()));
    }
}