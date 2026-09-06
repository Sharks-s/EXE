package com.exe101.exe.dto.response;

import com.exe101.exe.model.enums.RuleType;
import lombok.Builder;

@Builder
public record AppRuleResponse(
        Long id,
        String keyword,
        RuleType ruleType
) {}