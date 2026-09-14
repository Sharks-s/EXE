package com.exe101.exe.controller;

import com.exe101.exe.dto.response.AchievementResponse;
import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.security.CustomUserDetails;
import com.exe101.exe.service.AchievementService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/achievements")
@RequiredArgsConstructor
public class AchievementController {

    private final AchievementService achievementService;

    @GetMapping
    public ApiResponse<List<AchievementResponse>> getAll(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success(achievementService.getAllAchievements(userDetails.getId()));
    }

    @GetMapping("/me")
    public ApiResponse<List<AchievementResponse>> getMine(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success(achievementService.getMyAchievements(userDetails.getId()));
    }

    @GetMapping("/me/progress")
    public ApiResponse<List<AchievementResponse>> getMyProgress(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success(achievementService.getMyProgress(userDetails.getId()));
    }
}
