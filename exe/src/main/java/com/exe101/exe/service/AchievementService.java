package com.exe101.exe.service;

import com.exe101.exe.dto.response.AchievementResponse;
import com.exe101.exe.dto.response.UnlockedAchievementResponse;

import java.util.List;

public interface AchievementService {
    List<AchievementResponse> getAllAchievements(Long userId);

    List<AchievementResponse> getMyAchievements(Long userId);

    List<AchievementResponse> getMyProgress(Long userId);

    List<UnlockedAchievementResponse> checkSessionCompletedAchievements(Long userId);

    int getCurrentStreakDays(Long userId);

    void seedDefaultAchievements();
}
