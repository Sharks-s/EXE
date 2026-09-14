package com.exe101.exe.service;

import com.exe101.exe.dto.response.AdminViolationListItem;
import com.exe101.exe.dto.response.AdminViolationStatsResponse;
import com.exe101.exe.dto.response.PagedResponse;
import com.exe101.exe.model.enums.ViolationType;

import java.time.Instant;

public interface AdminViolationService {
    AdminViolationStatsResponse getStats(int days);

    PagedResponse<AdminViolationListItem> search(
            Long userId, ViolationType type, Instant from, Instant to, int page, int size
    );
}