package com.exe101.exe.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank
        String sessionToken,

        @NotBlank(message = "{validation.password.notBlank}")
        @Size(min = 6, max = 32, message = "{validation.password.size}")
        @Pattern(
                regexp = "^(?=.*[A-Z])(?=.*[a-z]).+$",
                message = "{validation.password.pattern}"
        )
        String password
) {}