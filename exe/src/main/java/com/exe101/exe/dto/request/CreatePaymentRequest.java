package com.exe101.exe.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CreatePaymentRequest(
        @NotBlank String planCode // vd: "PRO_MONTHLY", "PRO_YEARLY"
) {
}