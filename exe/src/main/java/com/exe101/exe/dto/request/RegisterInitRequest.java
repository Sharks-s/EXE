package com.exe101.exe.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import jakarta.validation.constraints.Size;

public record RegisterInitRequest(

        @Schema(format = "email", minLength = 1)
        @NotBlank(message = "{validation.email.notBlank}")
        @Email(message = "{validation.email.invalid}")
        @Size(max = 150, message = "{validation.email.size}")
        String email
) {}

