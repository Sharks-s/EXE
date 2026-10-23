package com.exe101.exe.dto.request;

import jakarta.validation.constraints.NotNull;

public record UpdateCameraSettingRequest(
        @NotNull Boolean cameraEnabled
) {
}
