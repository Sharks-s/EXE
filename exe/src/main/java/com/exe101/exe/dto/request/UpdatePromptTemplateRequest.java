package com.exe101.exe.dto.request;

import jakarta.validation.constraints.NotBlank;

public record UpdatePromptTemplateRequest(
        @NotBlank String template
) {}