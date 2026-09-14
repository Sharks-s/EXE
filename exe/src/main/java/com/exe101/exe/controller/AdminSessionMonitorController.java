package com.exe101.exe.controller;

import com.exe101.exe.dto.response.AdminSessionMonitorItem;
import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.service.AdminSessionMonitorService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin/sessions/active")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminSessionMonitorController {

    private final AdminSessionMonitorService adminSessionMonitorService;

    @GetMapping
    public ApiResponse<List<AdminSessionMonitorItem>> getActiveSessions() {
        return ApiResponse.success(adminSessionMonitorService.getActiveSessions());
    }
}