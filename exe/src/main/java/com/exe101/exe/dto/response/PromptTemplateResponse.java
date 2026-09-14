package com.exe101.exe.dto.response;

import java.time.Instant;

public record PromptTemplateResponse(
        Long id,
        String promptKey,
        String template,
        Instant updatedAt
) {}