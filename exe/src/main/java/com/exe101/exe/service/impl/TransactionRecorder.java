package com.exe101.exe.service.impl;

import com.exe101.exe.model.entity.Transaction;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.enums.PaymentProvider;
import com.exe101.exe.model.enums.TransactionStatus;
import com.exe101.exe.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Tách riêng để đảm bảo việc ghi PENDING transaction được COMMIT NGAY,
 * độc lập với transaction chính của createMomoPayment().
 * Nếu gọi MoMo thất bại RÕ RÀNG sau đó, record PENDING này không bị rollback mất —
 * phục vụ audit/debug, đồng thời được cập nhật sang FAILED thay vì biến mất.
 */
@Component
@RequiredArgsConstructor
public class TransactionRecorder {

    private final TransactionRepository transactionRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Transaction createPending(User user, String orderCode, String planCode,
                                     long amount, String requestId) {
        return createPending(user, orderCode, planCode, amount, requestId, PaymentProvider.MOMO);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Transaction createPending(User user, String orderCode, String planCode,
                                     long amount, String requestId, PaymentProvider provider) {
        Transaction transaction = Transaction.builder()
                .user(user)
                .orderCode(orderCode)
                .plan(planCode)
                .amount(amount)
                .provider(provider)
                .status(TransactionStatus.PENDING)
                .providerRequestId(requestId)
                .build();
        return transactionRepository.save(transaction);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markFailedToInitiate(String orderCode, String reason) {
        transactionRepository.findByOrderCode(orderCode).ifPresent(t -> {
            t.setStatus(TransactionStatus.FAILED);
            t.setAdminNote("Payment create call failed: " + reason);
            transactionRepository.save(t);
        });
    }
}
