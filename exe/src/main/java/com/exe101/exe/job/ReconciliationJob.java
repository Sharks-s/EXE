package com.exe101.exe.job;

import com.exe101.exe.model.entity.Transaction;
import com.exe101.exe.model.enums.TransactionStatus;
import com.exe101.exe.repository.TransactionRepository;
import com.exe101.exe.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReconciliationJob {

    private static final long PENDING_MIN_AGE_MINUTES = 15; // chỉ xử lý PENDING đã tạo > 15 phút
    private static final long PENDING_MAX_AGE_HOURS = 24;    // quá 24h không lấy vào batch nữa, cần admin xử lý thủ công

    private final TransactionRepository transactionRepository;
    private final PaymentService paymentService;

    @Scheduled(fixedDelayString = "${app.momo.reconciliation.interval-ms:300000}")
    public void reconcilePendingTransactions() {
        Instant now = Instant.now();

        List<Transaction> pendingTransactions = transactionRepository.findByStatusAndCreatedAtBetween(
                TransactionStatus.PENDING,
                now.minusSeconds(PENDING_MAX_AGE_HOURS * 3600),
                now.minusSeconds(PENDING_MIN_AGE_MINUTES * 60)
        );

        if (pendingTransactions.isEmpty()) {
            return;
        }

        log.info("[Reconciliation] Found {} pending transactions to check", pendingTransactions.size());

        for (Transaction transaction : pendingTransactions) {
            try {
                paymentService.reconcilePendingTransaction(transaction.getOrderCode());
            } catch (Exception e) {
                // Không để 1 giao dịch lỗi làm dừng cả batch
                log.error("[Reconciliation] Lỗi khi xử lý orderId={}", transaction.getOrderCode(), e);
            }
        }
    }
}