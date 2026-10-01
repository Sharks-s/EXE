package com.exe101.exe.service.impl;

import com.exe101.exe.config.OtpProperties;
import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.model.entity.OtpData;
import com.exe101.exe.model.enums.OtpStatus;
import com.exe101.exe.model.enums.OtpType;
import com.exe101.exe.repository.OtpStore;
import com.exe101.exe.service.MailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OtpServiceImplTest {

    @Mock
    private OtpStore otpStore;

    @Mock
    private MailService mailService;

    private OtpServiceImpl otpService;

    @BeforeEach
    void setUp() {
        OtpProperties otpProperties = new OtpProperties();
        otpProperties.setExpireMinutes(5);
        otpProperties.setLength(6);
        otpProperties.setMaxAttempts(5);
        otpService = new OtpServiceImpl(otpStore, otpProperties, mailService);
    }

    @Test
    void generateOtpStoresTypeAndSendsResetPasswordMail() {
        when(otpStore.getVerifyIdByUserId(1L, OtpType.RESET_PASSWORD)).thenReturn(Optional.empty());

        String verifyId = otpService.generateOtp(1L, "user@example.com", OtpType.RESET_PASSWORD);

        ArgumentCaptor<OtpData> otpCaptor = ArgumentCaptor.forClass(OtpData.class);
        verify(otpStore).saveOtp(eq(verifyId), otpCaptor.capture(), any());
        OtpData savedOtp = otpCaptor.getValue();

        assertEquals(1L, savedOtp.getUserId());
        assertEquals("user@example.com", savedOtp.getEmail());
        assertEquals(OtpType.RESET_PASSWORD, savedOtp.getType());
        assertEquals(OtpStatus.UNUSED, savedOtp.getStatus());
        assertTrue(savedOtp.getCode().matches("\\d{6}"));

        verify(otpStore).saveUserMapping(eq(1L), eq(OtpType.RESET_PASSWORD), eq(verifyId), any());
        verify(mailService).sendResetPasswordOtp("user@example.com", savedOtp.getCode());
        verify(mailService, never()).sendRegisterOtp(any(), any());
    }

    @Test
    void verifyOtpRejectsMismatchedType() {
        OtpData otp = OtpData.builder()
                .userId(1L)
                .email("user@example.com")
                .type(OtpType.REGISTER)
                .status(OtpStatus.UNUSED)
                .expiredAt(Instant.now().plusSeconds(60))
                .createdAt(Instant.now())
                .build();
        when(otpStore.getOtp("verify-id")).thenReturn(Optional.of(otp));

        BusinessException ex = assertThrows(
                BusinessException.class,
                () -> otpService.verifyOtp("verify-id", "123456", OtpType.RESET_PASSWORD)
        );

        assertEquals(ErrorCode.INVALID_OTP, ex.getErrorCode());
        verify(otpStore, never()).matchesCode(any(), any());
        verify(otpStore, never()).consumeOtp(any());
    }

    @Test
    void verifyOtpConsumesMatchingType() {
        OtpData otp = OtpData.builder()
                .userId(1L)
                .email("user@example.com")
                .type(OtpType.REGISTER)
                .status(OtpStatus.UNUSED)
                .expiredAt(Instant.now().plusSeconds(60))
                .createdAt(Instant.now())
                .build();
        when(otpStore.getOtp("verify-id")).thenReturn(Optional.of(otp));
        when(otpStore.matchesCode(otp, "123456")).thenReturn(true);
        when(otpStore.consumeOtp("verify-id")).thenReturn(true);

        OtpData result = otpService.verifyOtp("verify-id", "123456", OtpType.REGISTER);

        assertEquals(otp, result);
        verify(otpStore).consumeOtp("verify-id");
        verify(otpStore).delete("verify-id");
    }
}
