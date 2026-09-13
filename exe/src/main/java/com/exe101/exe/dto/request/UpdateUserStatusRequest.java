package com.exe101.exe.dto.request;

import com.exe101.exe.model.enums.UserStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateUserStatusRequest(
        @NotNull UserStatus status
) {
}