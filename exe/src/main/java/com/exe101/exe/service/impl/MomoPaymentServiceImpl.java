package com.exe101.exe.service.impl;

import com.exe101.exe.config.SePayProperties;
import com.exe101.exe.dto.request.CreatePaymentRequest;
import com.exe101.exe.dto.request.MomoIpnRequest;
import com.exe101.exe.dto.request.SePayIpnRequest;
import com.exe101.exe.dto.response.CreatePaymentResponse;
import com.exe101.exe.dto.response.TransactionStatusResponse;
import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.model.entity.Subscription;
import com.exe101.exe.model.entity.SubscriptionPlan;
import com.exe101.exe.model.entity.Transaction;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.enums.NotificationType;
import com.exe101.exe.model.enums.PaymentProvider;
import com.exe101.exe.model.enums.TransactionStatus;
import com.exe101.exe.repository.SubscriptionPlanRepository;
import com.exe101.exe.repository.SubscriptionRepository;
import com.exe101.exe.repository.TransactionRepository;
import com.exe101.exe.repository.UserRepository;
import com.exe101.exe.service.NotificationService;
import com.exe101.exe.service.PaymentService;
import com.exe101.exe.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.HtmlUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MomoPaymentServiceImpl implements PaymentService {

    private static final int MAX_ORDER_CODE_RETRY = 5;
    private static final long PAYURL_REUSE_WINDOW_MINUTES = 10;
    private static final List<String> SEPAY_SIGNED_FIELDS = List.of(
            "order_amount",
            "merchant",
            "currency",
            "operation",
            "order_description",
            "order_invoice_number",
            "customer_id",
            "payment_method",
            "success_url",
            "error_url",
            "cancel_url"
    );

    private final SePayProperties sePayProperties;
    private final TransactionRepository transactionRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final UserService userService;
    private final NotificationService notificationService;
    private final TransactionRecorder transactionRecorder;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;

    @Override
    public CreatePaymentResponse createMomoPayment(CreatePaymentRequest request, Long userId) {
        return createSePayPayment(request, userId);
    }

    @Override
    public void handleMomoIpn(MomoIpnRequest ipnRequest) {
        log.warn("[Payment] Ignored legacy MoMo IPN after SePay migration, orderId={}", ipnRequest.orderId());
    }

    @Override
    public CreatePaymentResponse createSePayPayment(CreatePaymentRequest request, Long userId) {
        User user = userService.findById(userId);

        SubscriptionPlan plan = subscriptionPlanRepository.findByCode(request.planCode())
                .filter(SubscriptionPlan::isActive)
                .orElseThrow(() -> new BusinessException(ErrorCode.SUBSCRIPTION_PLAN_NOT_FOUND));

        if (plan.getPriceVnd() == null || plan.getPriceVnd() <= 0) {
            throw new BusinessException(ErrorCode.INVALID_PLAN_FOR_PAYMENT);
        }

        long amount = plan.getPriceVnd();
        Optional<Transaction> reusableTransaction = transactionRepository
                .findFirstByUserIdAndPlanAndStatusOrderByCreatedAtDesc(
                        userId, plan.getCode(), TransactionStatus.PENDING)
                .filter(t -> t.getCreatedAt().isAfter(
                        Instant.now().minusSeconds(PAYURL_REUSE_WINDOW_MINUTES * 60)));

        String orderCode;
        String requestId;

        if (reusableTransaction.isPresent()) {
            Transaction existing = reusableTransaction.get();
            orderCode = existing.getOrderCode();
            requestId = existing.getProviderRequestId();
            log.info("[SePay] Reuse PENDING transaction orderCode={} user={}", orderCode, userId);
        } else {
            orderCode = generateUniqueOrderCode();
            requestId = UUID.randomUUID().toString();
            transactionRecorder.createPending(
                    user, orderCode, plan.getCode(), amount, requestId, PaymentProvider.MOMO);
        }

        String checkoutUrl = backendCheckoutUrl(orderCode);
        return CreatePaymentResponse.builder()
                .orderCode(orderCode)
                .checkoutUrl(checkoutUrl)
                .payUrl(checkoutUrl)
                .deeplink(null)
                .amount(amount)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public String buildSePayCheckoutForm(String orderCode) {
        Transaction transaction = transactionRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.TRANSACTION_NOT_FOUND));

        Map<String, String> fields = buildSePayFields(transaction);
        String inputs = fields.entrySet().stream()
                .map(entry -> """
                        <input type="hidden" name="%s" value="%s">
                        """.formatted(
                        HtmlUtils.htmlEscape(entry.getKey()),
                        HtmlUtils.htmlEscape(entry.getValue())))
                .collect(Collectors.joining("\n"));

        String action = HtmlUtils.htmlEscape(resolveCheckoutUrl());
        return """
                <!doctype html>
                <html lang="en">
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <title>Redirecting to SePay</title>
                  <style>
                    body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; }
                    main { width: min(420px, calc(100vw - 32px)); padding: 28px; border: 1px solid #e2e8f0; border-radius: 18px; background: white; box-shadow: 0 24px 60px rgba(15, 23, 42, .12); }
                    h1 { margin: 0 0 10px; font-size: 24px; }
                    p { margin: 0; color: #475569; line-height: 1.6; }
                  </style>
                </head>
                <body>
                  <main>
                    <h1>Opening SePay checkout...</h1>
                    <p>Please wait while Focus Buddy redirects you to the secure payment page.</p>
                  </main>
                  <form id="sepay-form" action="%s" method="POST">
                    %s
                  </form>
                  <script>document.getElementById("sepay-form").submit();</script>
                </body>
                </html>
                """.formatted(action, inputs);
    }

    @Override
    @Transactional
    public void handleSePayIpn(String secretKey, SePayIpnRequest ipn) {
        if (ipn == null || ipn.order() == null || ipn.order().orderInvoiceNumber() == null) {
            throw new BusinessException(ErrorCode.SEPAY_IPN_INVALID);
        }

        String orderCode = ipn.order().orderInvoiceNumber();
        log.info("[SePay IPN] Received notificationType={}, orderCode={}, orderStatus={}, amount={}",
                ipn.notificationType(), orderCode, ipn.order().orderStatus(), ipn.order().orderAmount());

        if (!isValidSePaySecret(secretKey)) {
            log.warn("[SePay IPN] Invalid X-Secret-Key, orderCode={}", orderCode);
            throw new BusinessException(ErrorCode.SEPAY_SIGNATURE_INVALID);
        }

        Transaction transaction = transactionRepository.findByOrderCodeForUpdate(orderCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.TRANSACTION_NOT_FOUND));

        if (transaction.getStatus() == TransactionStatus.SUCCESS) {
            log.info("[SePay IPN] Duplicate paid notification ignored, orderCode={}", orderCode);
            return;
        }

        if (!"ORDER_PAID".equals(ipn.notificationType())) {
            if ("TRANSACTION_VOID".equals(ipn.notificationType())) {
                transaction.setStatus(TransactionStatus.CANCELLED);
                transaction.setAdminNote("[SePay IPN] Transaction voided");
                transactionRepository.save(transaction);
            }
            log.info("[SePay IPN] Ignored notificationType={}, orderCode={}", ipn.notificationType(), orderCode);
            return;
        }

        if (!"CAPTURED".equals(ipn.order().orderStatus())) {
            log.info("[SePay IPN] Ignored non-captured orderStatus={}, orderCode={}",
                    ipn.order().orderStatus(), orderCode);
            return;
        }

        if (!"VND".equals(ipn.order().orderCurrency())) {
            throw new BusinessException(ErrorCode.SEPAY_IPN_INVALID);
        }

        BigDecimal receivedAmount = parseAmount(ipn.order().orderAmount());
        if (receivedAmount.compareTo(BigDecimal.valueOf(transaction.getAmount())) != 0) {
            log.error("[SePay IPN] Amount mismatch orderCode={}, expected={}, got={}",
                    orderCode, transaction.getAmount(), ipn.order().orderAmount());
            throw new BusinessException(ErrorCode.SEPAY_IPN_INVALID);
        }

        String transactionId = ipn.transaction() != null ? ipn.transaction().transactionId() : null;
        if (transactionId != null) {
            transactionRepository.findByProviderTransactionId(transactionId)
                    .filter(existing -> !existing.getId().equals(transaction.getId()))
                    .ifPresent(existing -> {
                        throw new BusinessException(ErrorCode.SEPAY_IPN_INVALID);
                    });
        }

        applySuccessfulPayment(transaction, transactionId, "SEPAY_IPN");
        log.info("[SePay IPN] Payment marked SUCCESS, orderCode={}, transactionId={}", orderCode, transactionId);
    }

    @Override
    @Transactional
    public TransactionStatusResponse getTransactionStatus(String orderCode, Long userId) {
        Transaction transaction = transactionRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.TRANSACTION_NOT_FOUND));

        if (!transaction.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.SESSION_UNAUTHORIZED_ACCESS);
        }

        if (transaction.getStatus() == TransactionStatus.PENDING) {
            reconcileSePayOrder(transaction);
        }

        return TransactionStatusResponse.builder()
                .orderCode(transaction.getOrderCode())
                .status(transaction.getStatus())
                .plan(transaction.getPlan())
                .amount(transaction.getAmount())
                .build();
    }

    @Override
    public void reconcilePendingTransaction(String orderCode) {
        log.debug("[SePay] Reconciliation skipped; waiting for IPN. orderCode={}", orderCode);
    }

    private Map<String, String> buildSePayFields(Transaction transaction) {
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("order_amount", String.valueOf(transaction.getAmount()));
        fields.put("merchant", sePayProperties.getMerchantId());
        fields.put("currency", "VND");
        fields.put("operation", "PURCHASE");
        fields.put("order_description", buildOrderDescription(transaction.getPlan()));
        fields.put("order_invoice_number", transaction.getOrderCode());
        fields.put("customer_id", String.valueOf(transaction.getUser().getId()));
        fields.put("payment_method", "BANK_TRANSFER");
        fields.put("success_url", sePayProperties.getSuccessUrl());
        fields.put("error_url", sePayProperties.getErrorUrl());
        fields.put("cancel_url", sePayProperties.getCancelUrl());
        fields.put("signature", generateSePaySignature(fields));
        return fields;
    }

    private String generateSePaySignature(Map<String, String> fields) {
        String signedString = SEPAY_SIGNED_FIELDS.stream()
                .filter(fields::containsKey)
                .map(key -> key + "=" + fields.get(key))
                .collect(Collectors.joining(","));

        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                    sePayProperties.getSecretKey().getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(signedString.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.SEPAY_REQUEST_FAILED);
        }
    }

    private String backendCheckoutUrl(String orderCode) {
        String baseUrl = sePayProperties.getBackendBaseUrl();
        if (baseUrl == null || baseUrl.isBlank()) {
            throw new BusinessException(ErrorCode.SEPAY_REQUEST_FAILED);
        }
        String normalizedBaseUrl = baseUrl.endsWith("/")
                ? baseUrl.substring(0, baseUrl.length() - 1)
                : baseUrl;
        return normalizedBaseUrl + "/payments/sepay/checkout/"
                + URLEncoder.encode(orderCode, StandardCharsets.UTF_8);
    }

    private String resolveCheckoutUrl() {
        if (sePayProperties.getMerchantId() != null
                && sePayProperties.getMerchantId().startsWith("SP-TEST-")) {
            return "https://pay-sandbox.sepay.vn/v1/checkout/init";
        }
        return sePayProperties.getCheckoutUrl();
    }

    private String resolveApiBaseUrl() {
        String merchantId = sePayProperties.getMerchantId();
        if (merchantId != null && merchantId.startsWith("SP-TEST-")) {
            return "https://pgapi-sandbox.sepay.vn";
        }
        if (merchantId != null && merchantId.startsWith("SP-LIVE-")) {
            return "https://pgapi.sepay.vn";
        }
        return sePayProperties.getApiBaseUrl();
    }

    private boolean isValidSePaySecret(String secretKey) {
        if (sePayProperties.getSecretKey() == null || sePayProperties.getSecretKey().isBlank()) {
            return true;
        }
        if (sePayProperties.getSecretKey().equals(secretKey)) {
            return true;
        }
        boolean sandboxMerchant = sePayProperties.getMerchantId() != null
                && sePayProperties.getMerchantId().startsWith("SP-TEST-");
        if (sandboxMerchant && (secretKey == null || secretKey.isBlank())) {
            log.warn("[SePay IPN] Missing X-Secret-Key accepted for sandbox merchant. Enable SECRET_KEY auth before production.");
            return true;
        }
        return false;
    }

    private void reconcileSePayOrder(Transaction transaction) {
        if (sePayProperties.getMerchantId() == null || sePayProperties.getMerchantId().isBlank()
                || sePayProperties.getSecretKey() == null || sePayProperties.getSecretKey().isBlank()) {
            return;
        }

        try {
            SePayOrderData order = fetchSePayOrder(transaction.getOrderCode());
            if (order == null) {
                return;
            }

            if (!"CAPTURED".equals(order.orderStatus())) {
                log.info("[SePay Sync] Order still not captured, orderCode={}, sePayStatus={}",
                        transaction.getOrderCode(), order.orderStatus());
                return;
            }

            BigDecimal receivedAmount = parseAmount(order.orderAmount());
            if (receivedAmount.compareTo(BigDecimal.valueOf(transaction.getAmount())) != 0) {
                log.error("[SePay Sync] Amount mismatch orderCode={}, expected={}, got={}",
                        transaction.getOrderCode(), transaction.getAmount(), order.orderAmount());
                return;
            }

            String transactionId = order.transactions() == null || order.transactions().isEmpty()
                    ? null
                    : order.transactions().getFirst().transactionId();
            applySuccessfulPayment(transaction, transactionId, "SEPAY_SYNC");
            log.info("[SePay Sync] Payment marked SUCCESS, orderCode={}, transactionId={}",
                    transaction.getOrderCode(), transactionId);
        } catch (org.springframework.web.client.HttpClientErrorException.Unauthorized e) {
            log.warn("[SePay Sync] 401 Unauthorized from SePay API ({}). Check SEPAY_MERCHANT_ID/SEPAY_SECRET_KEY match the environment. orderCode={}",
                    resolveApiBaseUrl(), transaction.getOrderCode());
        } catch (RestClientException e) {
            log.warn("[SePay Sync] Could not query orderCode={}", transaction.getOrderCode(), e);
        }
    }

    private SePayOrderData fetchSePayOrder(String orderCode) {
        HttpHeaders headers = new HttpHeaders();
        String credentials = sePayProperties.getMerchantId() + ":" + sePayProperties.getSecretKey();
        String basicAuth = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
        headers.set(HttpHeaders.AUTHORIZATION, "Basic " + basicAuth);

        String baseUrl = resolveApiBaseUrl();
        String normalizedBaseUrl = baseUrl.endsWith("/")
                ? baseUrl.substring(0, baseUrl.length() - 1)
                : baseUrl;
        String url = normalizedBaseUrl + "/v1/order?q="
                + URLEncoder.encode(orderCode, StandardCharsets.UTF_8);

        SePayOrderListResponse response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                SePayOrderListResponse.class
        ).getBody();

        if (response == null || response.data() == null) {
            return null;
        }

        return response.data().stream()
                .filter(order -> orderCode.equals(order.orderInvoiceNumber()))
                .findFirst()
                .orElse(null);
    }

    private record SePayOrderListResponse(
            List<SePayOrderData> data
    ) {
    }

    private record SePayOrderData(
            @com.fasterxml.jackson.annotation.JsonProperty("order_id")
            String orderId,
            @com.fasterxml.jackson.annotation.JsonProperty("order_invoice_number")
            String orderInvoiceNumber,
            @com.fasterxml.jackson.annotation.JsonProperty("order_status")
            String orderStatus,
            @com.fasterxml.jackson.annotation.JsonProperty("order_amount")
            String orderAmount,
            @com.fasterxml.jackson.annotation.JsonProperty("order_currency")
            String orderCurrency,
            List<SePayOrderTransaction> transactions
    ) {
    }

    private record SePayOrderTransaction(
            @com.fasterxml.jackson.annotation.JsonProperty("transaction_id")
            String transactionId,
            @com.fasterxml.jackson.annotation.JsonProperty("transaction_status")
            String transactionStatus
    ) {
    }

    private String generateUniqueOrderCode() {
        for (int i = 0; i < MAX_ORDER_CODE_RETRY; i++) {
            String random = UUID.randomUUID().toString()
                    .replace("-", "")
                    .substring(0, 12)
                    .toUpperCase();
            String candidate = "FB-" + random;
            if (!transactionRepository.existsByOrderCode(candidate)) {
                return candidate;
            }
        }
        throw new BusinessException(ErrorCode.SEPAY_REQUEST_FAILED);
    }

    private String buildOrderDescription(String planCode) {
        return "Focus Buddy Pro " + planCode;
    }

    private BigDecimal parseAmount(String amount) {
        try {
            return new BigDecimal(amount);
        } catch (NumberFormatException e) {
            throw new BusinessException(ErrorCode.SEPAY_IPN_INVALID);
        }
    }

    private void applySuccessfulPayment(Transaction transaction, String transactionId, String source) {
        SubscriptionPlan plan = subscriptionPlanRepository.findByCode(transaction.getPlan())
                .orElseThrow(() -> new BusinessException(ErrorCode.SUBSCRIPTION_PLAN_NOT_FOUND));

        Instant now = Instant.now();
        transaction.setStatus(TransactionStatus.SUCCESS);
        transaction.setProviderTransactionId(transactionId);
        transaction.setPaidAt(now);

        if (plan.getDurationDays() == null || plan.getDurationDays() <= 0) {
            log.error("[{}] Plan {} missing valid durationDays, orderCode={}",
                    source, plan.getCode(), transaction.getOrderCode());
            transaction.setAdminNote("Payment succeeded but plan.durationDays invalid. Manual reconciliation required.");
            transactionRepository.save(transaction);
            return;
        }

        long durationSeconds = (long) plan.getDurationDays() * 24 * 3600;
        userRepository.findByIdForUpdate(transaction.getUser().getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_ID_NOT_FOUND));

        List<Subscription> activeSubs =
                subscriptionRepository.findActiveByUserIdForUpdate(transaction.getUser().getId());
        Subscription subscription = activeSubs.stream()
                .filter(s -> s.getExpiresAt() != null && s.getExpiresAt().isAfter(now))
                .findFirst()
                .orElse(null);

        if (subscription != null) {
            Instant base = subscription.getExpiresAt().isAfter(now) ? subscription.getExpiresAt() : now;
            subscription.setExpiresAt(base.plusSeconds(durationSeconds));
            subscription.setPlan(plan.getPlan());
            subscription.setBillingCycle(plan.getBillingCycle());
            subscription.setActive(true);
        } else {
            subscription = Subscription.builder()
                    .user(transaction.getUser())
                    .plan(plan.getPlan())
                    .billingCycle(plan.getBillingCycle())
                    .startedAt(now)
                    .expiresAt(now.plusSeconds(durationSeconds))
                    .isActive(true)
                    .build();
        }

        Subscription savedSubscription = subscriptionRepository.save(subscription);
        transaction.setSubscription(savedSubscription);
        transactionRepository.save(transaction);

        notificationService.create(
                transaction.getUser().getId(),
                NotificationType.PAYMENT_SUCCESS,
                "Thanh toán thành công",
                "Gói " + displayPlanName(plan) + " đã được kích hoạt thành công.",
                "upgrade",
                Map.of(
                        "orderCode", transaction.getOrderCode(),
                        "plan", transaction.getPlan(),
                        "amount", transaction.getAmount(),
                        "subscriptionId", savedSubscription.getId()
                )
        );
    }

    private String displayPlanName(SubscriptionPlan plan) {
        return switch (plan.getCode()) {
            case "PRO_MONTHLY" -> "Pro tháng";
            case "PRO_YEARLY" -> "Pro năm";
            default -> plan.getName();
        };
    }
}
