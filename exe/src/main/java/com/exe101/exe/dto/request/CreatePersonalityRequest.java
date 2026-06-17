package com.exe101.exe.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatePersonalityRequest(
        @NotBlank(message = "{validation.personality.name.notBlank}")
        @Size(max = 50, message = "{validation.personality.name.size}")
        String code,

        @NotBlank(message = "{validation.personality.name.notBlank}")
        @Size(max = 100, message = "{validation.personality.name.size}")
        String name,

        @Size(max=255, message = "{validation.personality.description.size}")
        String description,

        boolean isPremium
) {
}
