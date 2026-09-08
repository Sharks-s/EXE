package com.exe101.exe.controller;

import com.exe101.exe.dto.request.CreateAppRuleRequest;
import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.dto.response.AppRuleResponse;
import com.exe101.exe.dto.response.AppRulesResponse;
import com.exe101.exe.security.CustomUserDetails;
import com.exe101.exe.service.AppRuleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/app-rules")
@RequiredArgsConstructor
public class AppRuleController {

    private final AppRuleService appRuleService;

    @GetMapping
    public ApiResponse<AppRulesResponse> getRulesForSession(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
                AppRulesResponse response = appRuleService.getRulesForUserSession(userDetails.getId());

        return ApiResponse.success(response);
    }

    @GetMapping("/me")
    public ApiResponse<List<AppRuleResponse>> getMyRules(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success(appRuleService.getMyRules(userDetails.getId()));
    }

    @PostMapping("/me")
    public ApiResponse<AppRuleResponse> createRule(
            @Valid @RequestBody CreateAppRuleRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success(appRuleService.createRule(userDetails.getId(), request));
    }

    @DeleteMapping("/me/{ruleId}")
    public ApiResponse<Void> deleteRule(
            @PathVariable Long ruleId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        appRuleService.deleteRule(userDetails.getId(), ruleId);
        return ApiResponse.success(null);
    }
}