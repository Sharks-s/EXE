package com.exe101.exe.controller;

import com.exe101.exe.dto.request.UpdatePromptTemplateRequest;
import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.dto.response.PromptTemplateResponse;
import com.exe101.exe.service.PromptTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/prompt-templates")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPromptTemplateController {

    private final PromptTemplateService promptTemplateService;

    @GetMapping
    public ApiResponse<List<PromptTemplateResponse>> getAll() {
        return ApiResponse.success(promptTemplateService.adminGetAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<PromptTemplateResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(promptTemplateService.adminGetById(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<PromptTemplateResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePromptTemplateRequest request
    ) {
        return ApiResponse.success(promptTemplateService.adminUpdate(id, request));
    }
}