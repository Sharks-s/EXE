package com.exe101.exe.dto.request;

import com.exe101.exe.model.enums.RuleType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateAppRuleRequest(
        @NotBlank @Size(max = 255) String keyword,
        @NotNull RuleType ruleType
) {}