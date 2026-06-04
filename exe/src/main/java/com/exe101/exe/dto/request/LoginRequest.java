package com.exe101.exe.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(

        @NotBlank(message = "{validation.email.notBlank}")
        @Email(message = "{validation.email.invalid}")
        @Size(min = 1, max = 150, message = "{validation.email.size}")
        String email,

        @NotBlank(message = "{validation.password.notBlank}")
        @Size(min = 1, max = 32, message = "{validation.password.size}")
        String password

) {
}