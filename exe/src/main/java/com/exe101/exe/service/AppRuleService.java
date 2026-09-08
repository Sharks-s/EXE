package com.exe101.exe.service;

import com.exe101.exe.dto.request.CreateAppRuleRequest;
import com.exe101.exe.dto.response.AppRuleResponse;
import com.exe101.exe.dto.response.AppRulesResponse;

import java.util.List;

public interface AppRuleService {
    AppRulesResponse getRulesForUserSession(Long userId);

    void seedDefaultAppRules();

    List<AppRuleResponse> getMyRules(Long userId);
    AppRuleResponse createRule(Long userId, CreateAppRuleRequest request);
    void deleteRule(Long userId, Long ruleId);
}
