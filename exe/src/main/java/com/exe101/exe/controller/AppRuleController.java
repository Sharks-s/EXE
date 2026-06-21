package com.exe101.exe.controller;

import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.dto.response.AppRulesResponse;
import com.exe101.exe.security.CustomUserDetails;
import com.exe101.exe.service.AppRuleService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/app-rules")
@RequiredArgsConstructor
public class AppRuleController {

    private final AppRuleService appRuleService;

    @GetMapping
    public ApiResponse<AppRulesResponse> getRulesForSession(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        // Lấy sạch sẽ danh sách Blacklist/Whitelist đã gộp dựa theo ID người dùng đang đăng nhập
        AppRulesResponse response = appRuleService.getRulesForUserSession(userDetails.getId());

        // Bọc vào ApiResponse giống hệt như bên FocusSessionController
        return ApiResponse.success(response);
    }
}