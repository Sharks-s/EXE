package com.exe101.exe.controller;

import com.exe101.exe.dto.request.CreatePaymentRequest;
import com.exe101.exe.dto.request.MomoIpnRequest;
import com.exe101.exe.dto.request.SePayIpnRequest;
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
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
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
            ErrorCode.SEPAY_SIGNATURE_INVALID,
            ErrorCode.SEPAY_IPN_INVALID,
            ErrorCode.TRANSACTION_NOT_FOUND
    );

    @PostMapping("/momo/create")
    public ApiResponse<CreatePaymentResponse> createMomoPayment(
            @Valid @RequestBody CreatePaymentRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        CreatePaymentResponse response = paymentService.createSePayPayment(request, userDetails.getId());
        return ApiResponse.success(response);
    }

    @PostMapping("/sepay/create")
    public ApiResponse<CreatePaymentResponse> createSePayPayment(
            @Valid @RequestBody CreatePaymentRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        CreatePaymentResponse response = paymentService.createSePayPayment(request, userDetails.getId());
        return ApiResponse.success(response);
    }

    @GetMapping(value = "/sepay/checkout/{orderCode}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> checkoutSePay(@PathVariable String orderCode) {
        return ResponseEntity.ok(paymentService.buildSePayCheckoutForm(orderCode));
    }

    @PostMapping("/sepay/ipn")
    public ResponseEntity<Map<String, Boolean>> handleSePayIpn(
            @RequestHeader(value = "X-Secret-Key", required = false) String secretKey,
            @RequestBody SePayIpnRequest request
    ) {
        try {
            paymentService.handleSePayIpn(secretKey, request);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (BusinessException e) {
            String orderCode = request != null && request.order() != null
                    ? request.order().orderInvoiceNumber()
                    : null;
            if (e.getErrorCode() == ErrorCode.SEPAY_SIGNATURE_INVALID) {
                log.warn("[SePay IPN] Unauthorized request, orderCode={}", orderCode);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            if (TERMINAL_IPN_ERRORS.contains(e.getErrorCode())) {
                log.warn("[SePay IPN] Terminal error, orderCode={}, code={}",
                        orderCode, e.getErrorCode());
                return ResponseEntity.ok(Map.of("success", true));
            }
            log.error("[SePay IPN] Unexpected business error, orderCode={}", orderCode, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception e) {
            log.error("[SePay IPN] Unexpected error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping(value = "/sepay/success", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> sePaySuccess() {
        return simpleHtml("Payment successful", "Payment received. You can close this window and return to Focus Buddy.");
    }

    @GetMapping(value = "/sepay/error", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> sePayError() {
        return simpleHtml("Payment failed", "Payment was not completed. You can close this window and try again.");
    }

    @GetMapping(value = "/sepay/cancel", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> sePayCancel() {
        return simpleHtml("Payment cancelled", "Payment was cancelled. You can close this window and return to Focus Buddy.");
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

    @GetMapping(value = "/momo/redirect", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> handleMomoRedirect(@RequestParam Map<String, String> params) {
        boolean success = "0".equals(params.get("resultCode"));
        String title = success ? "Payment successful" : "Payment result received";
        String message = success
                ? "Your payment was processed. You can close this window and return to FocusBuddy."
                : "MoMo has redirected back to FocusBuddy. You can close this window and check the app.";
        String html = """
                <!doctype html>
                <html lang=\"en\">
                <head>
                  <meta charset=\"utf-8\">
                  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">
                  <title>%s</title>
                  <style>
                    body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; }
                    main { width: min(420px, calc(100vw - 32px)); padding: 28px; border: 1px solid #e2e8f0; border-radius: 18px; background: white; box-shadow: 0 24px 60px rgba(15, 23, 42, .12); }
                    h1 { margin: 0 0 10px; font-size: 24px; }
                    p { margin: 0; color: #475569; line-height: 1.6; }
                  </style>
                </head>
                <body><main><h1>%s</h1><p>%s</p></main></body>
                </html>
                """.formatted(title, title, message);
        return ResponseEntity.ok(html);
    }

    private ResponseEntity<String> simpleHtml(String title, String message) {
        String html = """
                <!doctype html>
                <html lang=\"en\">
                <head>
                  <meta charset=\"utf-8\">
                  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">
                  <title>%s</title>
                  <style>
                    body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; }
                    main { width: min(420px, calc(100vw - 32px)); padding: 28px; border: 1px solid #e2e8f0; border-radius: 18px; background: white; box-shadow: 0 24px 60px rgba(15, 23, 42, .12); }
                    h1 { margin: 0 0 10px; font-size: 24px; }
                    p { margin: 0; color: #475569; line-height: 1.6; }
                  </style>
                </head>
                <body><main><h1>%s</h1><p>%s</p></main></body>
                </html>
                """.formatted(title, title, message);
        return ResponseEntity.ok(html);
    }

    @GetMapping("/{orderCode}/status")
    public ApiResponse<TransactionStatusResponse> getTransactionStatus(
            @PathVariable String orderCode,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success(paymentService.getTransactionStatus(orderCode, userDetails.getId()));
    }
}
