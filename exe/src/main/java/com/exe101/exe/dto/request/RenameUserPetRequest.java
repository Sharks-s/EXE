package com.exe101.exe.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RenameUserPetRequest(
        @NotBlank(message = "{validation.userPet.customName.notBlank}")
        @Size(max = 100, message = "{validation.userPet.customName.size}")
        String customName
) {
}
