package com.exe101.exe.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpgradeSubscriptionRequest(
        @NotBlank
        @Pattern(regexp = "^PRO_(MONTHLY|YEARLY)$", message = "Plan code must be PRO_MONTHLY or PRO_YEARLY")
        String planCode
) {}
