package com.exe101.exe.dto.response;

import java.util.List;

public record SessionCompleteResponse(
        Integer earnedPoints,
        Integer currentPoints,
        Integer earnedExperience,
        UserPetSessionResponse userPet,
        List<UnlockedAchievementResponse> unlockedAchievements,
        StreakResponse streak
) {
}
