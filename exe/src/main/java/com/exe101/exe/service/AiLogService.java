package com.exe101.exe.service;

import com.exe101.exe.dto.response.AiLogResponse;
import com.exe101.exe.dto.response.AiLogStatsResponse;
import com.exe101.exe.dto.response.PagedResponse;
import com.exe101.exe.model.enums.AiCallStatus;
import com.exe101.exe.model.enums.JsonParseStatus;

import java.time.Instant;

public interface AiLogService {
    PagedResponse<AiLogResponse> listLogs(
            String feature,
            AiCallStatus status,
            JsonParseStatus jsonParseStatus,
            Instant from,
            Instant to,
            int page,
            int size
    );

    AiLogStatsResponse getStats(int days);
}
