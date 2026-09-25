package com.exe101.exe.dto.request;

import com.exe101.exe.model.enums.UserFeedbackType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateUserFeedbackRequest(
        @NotNull UserFeedbackType type,
        @NotBlank @Size(max = 150) String title,
        @NotBlank @Size(max = 5000) String content,
        @Min(1) @Max(5) Integer rating
) {}
