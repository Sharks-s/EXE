package com.exe101.exe.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangeLanguageRequest(
        @NotBlank(message = "Language code is required")
        @Size(max = 10, message = "Language code must not exceed 10 characters")
        String language
) {}

