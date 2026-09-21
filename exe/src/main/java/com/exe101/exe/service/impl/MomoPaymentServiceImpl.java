package com.exe101.exe.service.impl;

import com.exe101.exe.config.MomoProperties;

import com.exe101.exe.dto.request.CreatePaymentRequest;
import com.exe101.exe.dto.request.MomoCreatePaymentRequest;
import com.exe101.exe.dto.request.MomoIpnRequest;
import com.exe101.exe.dto.request.MomoQueryRequest;
import com.exe101.exe.dto.response.CreatePaymentResponse;
import com.exe101.exe.dto.response.MomoCreatePaymentResult;
import com.exe101.exe.dto.response.MomoQueryResult;
import com.exe101.exe.dto.response.TransactionStatusResponse;
import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.exception.MomoAmbiguousResultException;
import com.exe101.exe.external.MomoClient;
import com.exe101.exe.model.entity.Subscription;
import com.exe101.exe.model.entity.SubscriptionPlan;
import com.exe101.exe.model.entity.Transaction;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.enums.NotificationType;
import com.exe101.exe.model.enums.TransactionStatus;
import com.exe101.exe.repository.SubscriptionPlanRepository;
import com.exe101.exe.repository.SubscriptionRepository;
import com.exe101.exe.repository.TransactionRepository;
import com.exe101.exe.repository.UserRepository;
import com.exe101.exe.security.MomoSignatureUtil;
import com.exe101.exe.service.PaymentService;
import com.exe101.exe.service.NotificationService;
import com.exe101.exe.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MomoPaymentServiceImpl implements PaymentService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter ORDER_CODE_FORMAT =
            DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final int MAX_ORDER_CODE_RETRY = 5;

    private final MomoClient momoClient;
    private final MomoProperties momoProperties;
    private final TransactionRepository transactionRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final UserService userService;
    private final NotificationService notificationService;
    private final TransactionRecorder transactionRecorder;
    private final UserRepository userRepository;

    private static final long PAYURL_REUSE_WINDOW_MINUTES = 10;

    @Override
    public CreatePaymentResponse createMomoPayment(CreatePaymentRequest request, Long userId) {
        User user = userService.findById(userId);

        SubscriptionPlan plan = subscriptionPlanRepository.findByCode(request.planCode())
                .orElseThrow(() -> new BusinessException(ErrorCode.SUBSCRIPTION_PLAN_NOT_FOUND));

        if (plan.getPriceVnd() == null || plan.getPriceVnd() <= 0) {
            throw new BusinessException(ErrorCode.INVALID_PLAN_FOR_PAYMENT);
        }

        long amount = plan.getPriceVnd();

        // Tìm giao dịch PENDING gần nhất cùng plan -> tránh tạo rác nếu user thoát
        // ra rồi bấm nâng cấp lại ngay sau đó
        Optional<Transaction> reusableTransaction = transactionRepository
                .findFirstByUserIdAndPlanAndStatusOrderByCreatedAtDesc(
                        userId, plan.getCode(), TransactionStatus.PENDING)
                .filter(t -> t.getCreatedAt().isAfter(
                        Instant.now().minusSeconds(PAYURL_REUSE_WINDOW_MINUTES * 60)));

        String orderCode;
        String requestId;

        if (reusableTransaction.isPresent()) {
            // Dùng lại transaction PENDING gần đây để tránh tạo nhiều payment order
            // khi user thoát ra rồi bấm mua lại ngay.
            Transaction existing = reusableTransaction.get();
            orderCode = existing.getOrderCode();
            requestId = existing.getProviderRequestId();
            log.info("[Payment] Reuse PENDING transaction orderId={} user={}", orderCode, userId);
        } else {
            orderCode = generateUniqueOrderCode(userId);
            requestId = UUID.randomUUID().toString();
            transactionRecorder.createPending(user, orderCode, plan.getCode(), amount, requestId);
        }

        String extraData = "";
        String orderInfo = buildOrderInfo(plan);
        String rawSignature = MomoSignatureUtil.buildCreateRawSignature(
                momoProperties.getAccessKey(), amount, extraData, momoProperties.getIpnUrl(),
                orderCode, orderInfo, momoProperties.getPartnerCode(),
                momoProperties.getRedirectUrl(), requestId, momoProperties.getRequestType());
        String signature = MomoSignatureUtil.hmacSha256(rawSignature, momoProperties.getSecretKey());

        MomoCreatePaymentRequest momoRequest = MomoCreatePaymentRequest.builder()
                .partnerCode(momoProperties.getPartnerCode())
                .partnerName(momoProperties.getPartnerName())
                .storeId(momoProperties.getStoreId())
                .requestId(requestId)
                .amount(amount)
                .orderId(orderCode)
                .orderInfo(orderInfo)
                .redirectUrl(momoProperties.getRedirectUrl())
                .ipnUrl(momoProperties.getIpnUrl())
                .requestType(momoProperties.getRequestType())
                .extraData(extraData)
                .signature(signature)
                .lang("vi")
                .build();

        MomoCreatePaymentResult result;
        try {
            result = momoClient.createPayment(momoRequest);
        } catch (MomoAmbiguousResultException e) {
            log.warn("[Payment] Ambiguous result khi tạo payment orderId={}, giữ PENDING chờ reconciliation",
                    orderCode, e);
            throw new BusinessException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        } catch (BusinessException e) {
            // Chỉ mark FAILED nếu đây là transaction MỚI tạo — không đụng transaction cũ đang tái sử dụng,
            // vì nó có thể vẫn đang chờ IPN từ lần request trước đó
            if (reusableTransaction.isEmpty()) {
                transactionRecorder.markFailedToInitiate(orderCode, e.getMessage());
            }
            throw e;
        }

        return CreatePaymentResponse.builder()
                .orderCode(orderCode)
                .payUrl(result.payUrl())
                .deeplink(result.deeplink())
                .amount(amount)
                .build();
    }

    @Override
    @Transactional
    public void handleMomoIpn(MomoIpnRequest ipn) {
        String rawSignature = MomoSignatureUtil.buildIpnRawSignature(
                momoProperties.getAccessKey(), ipn.amount(), nullToEmpty(ipn.extraData()),
                nullToEmpty(ipn.message()), ipn.orderId(), nullToEmpty(ipn.orderInfo()),
                nullToEmpty(ipn.orderType()), ipn.partnerCode(), nullToEmpty(ipn.payType()),
                ipn.requestId(), ipn.responseTime(), ipn.resultCode(), ipn.transId());
        String expectedSignature = MomoSignatureUtil.hmacSha256(rawSignature, momoProperties.getSecretKey());

        if (!MomoSignatureUtil.isValidSignature(expectedSignature, ipn.signature())) {
            log.warn("[Momo IPN] Invalid signature, orderId={}", ipn.orderId());
            throw new BusinessException(ErrorCode.MOMO_SIGNATURE_INVALID);
        }

        if (!momoProperties.getPartnerCode().equals(ipn.partnerCode())) {
            log.warn("[Momo IPN] partnerCode mismatch, got={}", ipn.partnerCode());
            throw new BusinessException(ErrorCode.MOMO_IPN_INVALID);
        }

        Transaction transaction = transactionRepository.findByOrderCodeForUpdate(ipn.orderId())
                .orElseThrow(() -> new BusinessException(ErrorCode.TRANSACTION_NOT_FOUND));

        if (!Objects.equals(transaction.getAmount(), ipn.amount())) {
            log.error("[Momo IPN] Amount mismatch! orderId={}, expected={}, got={}",
                    ipn.orderId(), transaction.getAmount(), ipn.amount());
            throw new BusinessException(ErrorCode.MOMO_IPN_INVALID);
        }

        applyPaymentResult(transaction, ipn.transId(), ipn.resultCode(), ipn.message(), "IPN");
    }

    @Override
    @Transactional
    public void reconcilePendingTransaction(String orderCode) {
        Transaction transaction = transactionRepository.findByOrderCodeForUpdate(orderCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.TRANSACTION_NOT_FOUND));

        if (transaction.getStatus() != TransactionStatus.PENDING) {
            return; // đã có IPN xử lý xong trước khi job chạy tới, bỏ qua
        }

        String requestId = UUID.randomUUID().toString();
        String rawSignature = MomoSignatureUtil.buildQueryRawSignature(
                momoProperties.getAccessKey(), orderCode, momoProperties.getPartnerCode(), requestId);
        String signature = MomoSignatureUtil.hmacSha256(rawSignature, momoProperties.getSecretKey());

        MomoQueryRequest queryRequest = MomoQueryRequest.builder()
                .partnerCode(momoProperties.getPartnerCode())
                .requestId(requestId)
                .orderId(orderCode)
                .signature(signature)
                .lang("vi")
                .build();

        MomoQueryResult result;
        try {
            result = momoClient.queryTransaction(queryRequest);
        } catch (MomoAmbiguousResultException e) {
            log.warn("[Reconciliation] Vẫn chưa xác định được kết quả cho orderId={}, thử lại lần sau", orderCode);
            return;
        }

        if (result.resultCode() == null) {
            log.warn("[Reconciliation] MoMo trả resultCode null cho orderId={}, thử lại lần sau", orderCode);
            return;
        }

        // resultCode = 7002: giao dịch đang được xử lý (user chưa thanh toán xong) -> chưa kết luận, chờ tiếp
        if (result.resultCode() == 7002) {
            log.info("[Reconciliation] orderId={} vẫn đang xử lý phía MoMo, chờ lần sau", orderCode);
            return;
        }

        if (!Objects.equals(transaction.getAmount(), result.amount())) {
            log.error("[Reconciliation] Amount mismatch! orderId={}, expected={}, got={}",
                    orderCode, transaction.getAmount(), result.amount());
            return; // không tự xử lý, cần admin kiểm tra
        }

        applyPaymentResult(transaction, result.transId(), result.resultCode(), result.message(), "RECONCILIATION");
    }


    @Override
    public TransactionStatusResponse getTransactionStatus(String orderCode, Long userId) {
        Transaction transaction = transactionRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.TRANSACTION_NOT_FOUND));

        if (!transaction.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.SESSION_UNAUTHORIZED_ACCESS);
        }

        return TransactionStatusResponse.builder()
                .orderCode(transaction.getOrderCode())
                .status(transaction.getStatus())
                .plan(transaction.getPlan())
                .amount(transaction.getAmount())
                .build();
    }

    // Helper

    private String generateUniqueOrderCode(Long userId) {
        for (int i = 0; i < MAX_ORDER_CODE_RETRY; i++) {
            String ts = Instant.now().atZone(VN_ZONE).format(ORDER_CODE_FORMAT);
            String random = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            String candidate = "EXE" + ts + userId + random;
            if (!transactionRepository.existsByOrderCode(candidate)) {
                return candidate;
            }
        }
        throw new BusinessException(ErrorCode.MOMO_REQUEST_FAILED);
    }

    private String buildOrderInfo(SubscriptionPlan plan) {
        return "Thanh toán gói " + plan.getName();
    }

    private String nullToEmpty(String value) {
        return value != null ? value : "";
    }

    /**
     * Logic dùng chung cho cả IPN và Reconciliation, xử lý sau khi đã xác thực đủ:
     * amount khớp, transaction đang PENDING và đã bị khoá dòng.
     */
    private void applyPaymentResult(Transaction transaction, Long transId, Integer resultCode,
                                    String message, String source) {
        transaction.setProviderTransactionId(transId != null ? String.valueOf(transId) : null);

        boolean success = resultCode != null && resultCode == 0;

        if (!success) {
            transaction.setStatus(TransactionStatus.FAILED);
            transaction.setAdminNote("[" + source + "] Momo resultCode=" + resultCode + " message=" + message);
            transactionRepository.save(transaction);
            return;
        }

        SubscriptionPlan plan = subscriptionPlanRepository.findByCode(transaction.getPlan())
                .orElseThrow(() -> new BusinessException(ErrorCode.SUBSCRIPTION_PLAN_NOT_FOUND));

        Instant now = Instant.now();
        transaction.setStatus(TransactionStatus.SUCCESS);
        transaction.setPaidAt(now);

        if (plan.getDurationDays() == null || plan.getDurationDays() <= 0) {
            log.error("[{}] Plan {} thiếu durationDays hợp lệ, orderId={} — " +
                            "PAYMENT THÀNH CÔNG nhưng CHƯA CẤP subscription, cần xử lý thủ công!",
                    source, plan.getCode(), transaction.getOrderCode());
            transaction.setAdminNote("Payment succeeded but plan.durationDays invalid. " +
                    "Manual reconciliation required to grant subscription.");
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
                "Gói " + plan.getName() + " đã được kích hoạt thành công.",
                "upgrade",
                Map.of(
                        "orderCode", transaction.getOrderCode(),
                        "plan", transaction.getPlan(),
                        "amount", transaction.getAmount(),
                        "subscriptionId", savedSubscription.getId()
                )
        );
    }
}
