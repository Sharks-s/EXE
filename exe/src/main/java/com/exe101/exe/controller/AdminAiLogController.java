package com.exe101.exe.controller;

import com.exe101.exe.dto.response.AiLogResponse;
import com.exe101.exe.dto.response.AiLogStatsResponse;
import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.dto.response.PagedResponse;
import com.exe101.exe.model.enums.AiCallStatus;
import com.exe101.exe.model.enums.JsonParseStatus;
import com.exe101.exe.service.AiLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/admin/ai-logs")
@RequiredArgsConstructor
public class AdminAiLogController {

    private final AiLogService aiLogService;

    @GetMapping
    public ApiResponse<PagedResponse<AiLogResponse>> listLogs(
            @RequestParam(required = false) String feature,
            @RequestParam(required = false) AiCallStatus status,
            @RequestParam(required = false) JsonParseStatus jsonParseStatus,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(aiLogService.listLogs(feature, status, jsonParseStatus, from, to, page, size));
    }

    @GetMapping("/stats")
    public ApiResponse<AiLogStatsResponse> getStats(@RequestParam(defaultValue = "7") int days) {
        return ApiResponse.success(aiLogService.getStats(days));
    }
}
