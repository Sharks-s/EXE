package com.exe101.exe.dto.response;

import com.exe101.exe.model.enums.UserGender;
import com.exe101.exe.model.enums.UserStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record AdminUserDetailResponse(
        Long id,
        String email,
        String fullName,
        String avatarUrl,
        String phoneNumber,
        UserGender gender,
        LocalDate dateOfBirth,
        UserStatus status,
        Integer dailyUsedMinutes,
        boolean onboardingCompleted,
        boolean profileCompleted,
        String personalityCode,
        List<String> roles,
        boolean isPremium,
        Instant lastLoginAt,
        Instant createdAt,
        long totalFocusSessions
) {
}