package com.exe101.exe.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdatePetRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 512) String description,
        @Size(max = 512) String imageUrl,
        boolean premium
) {}