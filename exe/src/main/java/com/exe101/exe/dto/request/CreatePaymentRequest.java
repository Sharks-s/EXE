package com.exe101.exe.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

public record CreatePaymentRequest(
        @JsonAlias("plan")
        @NotBlank String planCode // vd: "PRO_MONTHLY", "PRO_YEARLY"
) {
}
