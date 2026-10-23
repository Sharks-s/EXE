package com.exe101.exe.service;

import com.exe101.exe.dto.response.UserSettingResponse;

public interface UserSettingService {
    UserSettingResponse getSettings(Long userId);

    UserSettingResponse updateCameraEnabled(Long userId, boolean cameraEnabled);
}
