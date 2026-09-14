package com.exe101.exe.service.impl;

import com.exe101.exe.dto.response.PagedResponse;
import com.exe101.exe.dto.response.PointTransactionResponse;
import com.exe101.exe.dto.response.WalletResponse;
import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.model.entity.PointTransaction;
import com.exe101.exe.model.entity.PointWallet;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.enums.PointTransactionType;
import com.exe101.exe.repository.PointTransactionRepository;
import com.exe101.exe.repository.PointWalletRepository;
import com.exe101.exe.service.PointService;
import com.exe101.exe.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PointServiceImpl implements PointService {

    private final PointWalletRepository pointWalletRepository;
    private final PointTransactionRepository pointTransactionRepository;
    private final UserService userService;

    @Override
    @Transactional
    public WalletResponse getWallet(Long userId) {
        return toWalletResponse(getOrCreateWallet(userId));
    }

    @Override
    public PagedResponse<PointTransactionResponse> getTransactions(Long userId, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 50);
        Page<PointTransaction> transactionPage = pointTransactionRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(safePage, safeSize));

        return new PagedResponse<>(
                transactionPage.getContent().stream()
                        .map(this::toTransactionResponse)
                        .toList(),
                transactionPage.getNumber(),
                transactionPage.getTotalElements(),
                transactionPage.getTotalPages(),
                transactionPage.hasNext()
        );
    }

    @Override
    @Transactional
    public WalletResponse creditWallet(
            Long userId,
            int amount,
            PointTransactionType type,
            String reason,
            String referenceId
    ) {
        if (amount <= 0) {
            throw new BusinessException(ErrorCode.INVALID_POINT_AMOUNT);
        }
        if (isDuplicate(userId, referenceId, type)) {
            return toWalletResponse(getOrCreateWallet(userId));
        }

        PointWallet wallet = getOrCreateWalletForUpdate(userId);
        wallet.setCurrentPoints(wallet.getCurrentPoints() + amount);
        wallet.setTotalEarnedPoints(wallet.getTotalEarnedPoints() + amount);
        pointWalletRepository.save(wallet);
        saveTransaction(wallet.getUser(), amount, type, reason, referenceId);
        return toWalletResponse(wallet);
    }

    @Override
    @Transactional
    public WalletResponse debitWallet(
            Long userId,
            int amount,
            PointTransactionType type,
            String reason,
            String referenceId
    ) {
        if (amount <= 0) {
            throw new BusinessException(ErrorCode.INVALID_POINT_AMOUNT);
        }
        if (isDuplicate(userId, referenceId, type)) {
            return toWalletResponse(getOrCreateWallet(userId));
        }

        PointWallet wallet = getOrCreateWalletForUpdate(userId);
        if (wallet.getCurrentPoints() < amount) {
            throw new BusinessException(ErrorCode.INSUFFICIENT_POINTS);
        }

        wallet.setCurrentPoints(wallet.getCurrentPoints() - amount);
        wallet.setTotalSpentPoints(wallet.getTotalSpentPoints() + amount);
        pointWalletRepository.save(wallet);
        saveTransaction(wallet.getUser(), -amount, type, reason, referenceId);
        return toWalletResponse(wallet);
    }

    private boolean isDuplicate(Long userId, String referenceId, PointTransactionType type) {
        return pointTransactionRepository.existsByUserIdAndReferenceIdAndType(userId, referenceId, type);
    }

    private PointWallet getOrCreateWallet(Long userId) {
        return pointWalletRepository.findByUserId(userId)
                .orElseGet(() -> createWallet(userId));
    }

    private PointWallet getOrCreateWalletForUpdate(Long userId) {
        PointWallet wallet = pointWalletRepository.findByUserIdForUpdate(userId).orElse(null);
        if (wallet != null) {
            return wallet;
        }
        return createWallet(userId);
    }

    private PointWallet createWallet(Long userId) {
        User user = userService.findById(userId);
        PointWallet wallet = PointWallet.builder()
                .user(user)
                .currentPoints(0)
                .totalEarnedPoints(0)
                .totalSpentPoints(0)
                .build();
        try {
            return pointWalletRepository.save(wallet);
        } catch (DataIntegrityViolationException ex) {
            return pointWalletRepository.findByUserId(userId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.INTERNAL_ERROR, "Failed to create point wallet", ex));
        }
    }

    private void saveTransaction(
            User user,
            int amount,
            PointTransactionType type,
            String reason,
            String referenceId
    ) {
        PointTransaction transaction = PointTransaction.builder()
                .user(user)
                .amount(amount)
                .type(type)
                .reason(reason)
                .referenceId(referenceId)
                .build();
        try {
            pointTransactionRepository.save(transaction);
        } catch (DataIntegrityViolationException ex) {
            throw new BusinessException(ErrorCode.POINT_TRANSACTION_DUPLICATE, "Duplicate point transaction", ex);
        }
    }

    private WalletResponse toWalletResponse(PointWallet wallet) {
        return new WalletResponse(
                wallet.getCurrentPoints(),
                wallet.getTotalEarnedPoints(),
                wallet.getTotalSpentPoints()
        );
    }

    private PointTransactionResponse toTransactionResponse(PointTransaction transaction) {
        return new PointTransactionResponse(
                transaction.getId(),
                transaction.getAmount(),
                transaction.getType(),
                transaction.getReason(),
                transaction.getReferenceId(),
                transaction.getCreatedAt()
        );
    }
}
