package com.exe101.exe.service;

import com.exe101.exe.dto.response.PagedResponse;
import com.exe101.exe.dto.response.PointTransactionResponse;
import com.exe101.exe.dto.response.WalletResponse;
import com.exe101.exe.model.enums.PointTransactionType;

public interface PointService {
    WalletResponse getWallet(Long userId);

    PagedResponse<PointTransactionResponse> getTransactions(Long userId, int page, int size);

    WalletResponse creditWallet(
            Long userId,
            int amount,
            PointTransactionType type,
            String reason,
            String referenceId
    );

    WalletResponse debitWallet(
            Long userId,
            int amount,
            PointTransactionType type,
            String reason,
            String referenceId
    );
}
