package com.exe101.exe.dto.response;

import com.exe101.exe.model.enums.AchievementCategory;
import com.exe101.exe.model.enums.AchievementRarity;
import com.exe101.exe.model.enums.UserAchievementStatus;

import java.time.Instant;

public record AchievementResponse(
        Long id,
        String code,
        String name,
        String description,
        String icon,
        AchievementCategory category,
        AchievementRarity rarity,
        Integer targetValue,
        Integer rewardPoints,
        Integer progress,
        UserAchievementStatus status,
        Instant unlockedAt
) {
}
