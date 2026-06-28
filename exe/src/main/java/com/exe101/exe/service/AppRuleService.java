package com.exe101.exe.service;

import com.exe101.exe.dto.response.AppRulesResponse;

public interface AppRuleService {
    AppRulesResponse getRulesForUserSession(Long userId);

    void seedDefaultAppRules();
}
