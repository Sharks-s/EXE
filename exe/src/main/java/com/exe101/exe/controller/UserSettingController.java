package com.exe101.exe.controller;

import com.exe101.exe.dto.request.UpdateCameraSettingRequest;
import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.dto.response.UserSettingResponse;
import com.exe101.exe.security.CustomUserDetails;
import com.exe101.exe.service.UserSettingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/users/me/settings")
public class UserSettingController {
    private final UserSettingService userSettingService;

    @GetMapping
    public ApiResponse<UserSettingResponse> getSettings(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success(userSettingService.getSettings(userDetails.getId()));
    }

    @PatchMapping("/camera")
    public ApiResponse<UserSettingResponse> updateCamera(
            @Valid @RequestBody UpdateCameraSettingRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success(
                userSettingService.updateCameraEnabled(userDetails.getId(), request.cameraEnabled())
        );
    }
}
