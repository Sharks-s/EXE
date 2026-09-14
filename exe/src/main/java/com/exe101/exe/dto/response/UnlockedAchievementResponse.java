package com.exe101.exe.dto.response;

public record UnlockedAchievementResponse(
        String code,
        String name,
        Integer rewardPoints
) {
}
