package com.exe101.exe.dto.request;

import com.exe101.exe.model.enums.UserFeedbackStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateUserFeedbackStatusRequest(
        @NotNull UserFeedbackStatus status
) {}
