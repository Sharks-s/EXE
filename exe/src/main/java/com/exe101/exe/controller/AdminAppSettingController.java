package com.exe101.exe.controller;

import com.exe101.exe.dto.request.UpdateAppSettingRequest;
import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.dto.response.AppSettingResponse;
import com.exe101.exe.service.AppSettingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/app-settings")
@RequiredArgsConstructor
public class AdminAppSettingController {

    private final AppSettingService appSettingService;

    @GetMapping
    public ApiResponse<List<AppSettingResponse>> getAll() {
        return ApiResponse.success(appSettingService.getAll());
    }

    @PatchMapping("/{key}")
    public ApiResponse<AppSettingResponse> update(
            @PathVariable String key,
            @Valid @RequestBody UpdateAppSettingRequest request
    ) {
        return ApiResponse.success(appSettingService.update(key, request.value()));
    }
}
