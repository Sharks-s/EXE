package com.exe101.exe.service.impl;

import com.exe101.exe.dto.response.WalletResponse;
import com.exe101.exe.model.entity.PointTransaction;
import com.exe101.exe.model.entity.PointWallet;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.enums.PointTransactionType;
import com.exe101.exe.repository.PointTransactionRepository;
import com.exe101.exe.repository.PointWalletRepository;
import com.exe101.exe.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PointServiceImplTest {

    @Mock
    private PointWalletRepository pointWalletRepository;

    @Mock
    private PointTransactionRepository pointTransactionRepository;

    @Mock
    private UserService userService;

    private PointServiceImpl pointService;

    @BeforeEach
    void setUp() {
        pointService = new PointServiceImpl(pointWalletRepository, pointTransactionRepository, userService);
    }

    @Test
    void creditWalletAddsPointsAndCreatesTransaction() {
        User user = User.builder().id(1L).email("user@example.com").build();
        PointWallet wallet = PointWallet.builder()
                .user(user)
                .currentPoints(10)
                .totalEarnedPoints(10)
                .totalSpentPoints(0)
                .build();
        when(pointTransactionRepository.existsByUserIdAndReferenceIdAndType(
                1L, "session-1", PointTransactionType.SESSION_REWARD
        )).thenReturn(false);
        when(pointWalletRepository.findByUserIdForUpdate(1L)).thenReturn(Optional.of(wallet));

        WalletResponse response = pointService.creditWallet(
                1L,
                20,
                PointTransactionType.SESSION_REWARD,
                "Focus session reward",
                "session-1"
        );

        assertEquals(30, response.currentPoints());
        assertEquals(30, response.totalEarnedPoints());

        ArgumentCaptor<PointTransaction> transactionCaptor = ArgumentCaptor.forClass(PointTransaction.class);
        verify(pointTransactionRepository).save(transactionCaptor.capture());
        PointTransaction transaction = transactionCaptor.getValue();
        assertEquals(20, transaction.getAmount());
        assertEquals(PointTransactionType.SESSION_REWARD, transaction.getType());
        assertEquals("session-1", transaction.getReferenceId());
    }

    @Test
    void creditWalletDoesNotCreateDuplicateTransaction() {
        User user = User.builder().id(1L).email("user@example.com").build();
        PointWallet wallet = PointWallet.builder()
                .user(user)
                .currentPoints(30)
                .totalEarnedPoints(30)
                .totalSpentPoints(0)
                .build();
        when(pointTransactionRepository.existsByUserIdAndReferenceIdAndType(
                1L, "session-1", PointTransactionType.SESSION_REWARD
        )).thenReturn(true);
        when(pointWalletRepository.findByUserId(1L)).thenReturn(Optional.of(wallet));

        WalletResponse response = pointService.creditWallet(
                1L,
                20,
                PointTransactionType.SESSION_REWARD,
                "Focus session reward",
                "session-1"
        );

        assertEquals(30, response.currentPoints());
        verify(pointWalletRepository, never()).findByUserIdForUpdate(1L);
        verify(pointWalletRepository, never()).save(any());
        verify(pointTransactionRepository, never()).save(any());
    }
}
