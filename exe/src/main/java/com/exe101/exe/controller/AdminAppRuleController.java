package com.exe101.exe.controller;

import com.exe101.exe.dto.request.CreateAppRuleRequest;
import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.dto.response.AppRuleResponse;
import com.exe101.exe.service.AppRuleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/app-rules")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAppRuleController {

    private final AppRuleService appRuleService;

    @GetMapping
    public ApiResponse<List<AppRuleResponse>> getAll() {
        return ApiResponse.success(appRuleService.adminGetGlobalRules());
    }

    @PostMapping
    public ApiResponse<AppRuleResponse> create(@Valid @RequestBody CreateAppRuleRequest request) {
        return ApiResponse.success(appRuleService.adminCreateGlobalRule(request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        appRuleService.adminDeleteGlobalRule(id);
        return ApiResponse.success(null);
    }
}