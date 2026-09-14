package com.exe101.exe.controller;

import com.exe101.exe.dto.response.AdminViolationListItem;
import com.exe101.exe.dto.response.AdminViolationStatsResponse;
import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.dto.response.PagedResponse;
import com.exe101.exe.model.enums.ViolationType;
import com.exe101.exe.service.AdminViolationService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/admin/violations")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminViolationController {

    private final AdminViolationService adminViolationService;

    @GetMapping("/stats")
    public ApiResponse<AdminViolationStatsResponse> getStats(
            @RequestParam(defaultValue = "7") int days
    ) {
        return ApiResponse.success(adminViolationService.getStats(days));
    }

    @GetMapping
    public ApiResponse<PagedResponse<AdminViolationListItem>> search(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) ViolationType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(
                adminViolationService.search(userId, type, from, to, page, size)
        );
    }
}