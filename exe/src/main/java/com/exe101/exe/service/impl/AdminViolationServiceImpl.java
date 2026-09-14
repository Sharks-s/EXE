package com.exe101.exe.service.impl;

import com.exe101.exe.dto.response.AdminViolationListItem;
import com.exe101.exe.dto.response.AdminViolationStatsResponse;
import com.exe101.exe.dto.response.PagedResponse;
import com.exe101.exe.model.entity.Violation;
import com.exe101.exe.model.enums.ViolationType;
import com.exe101.exe.repository.ViolationRepository;
import com.exe101.exe.service.AdminViolationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminViolationServiceImpl implements AdminViolationService {

    private static final int TOP_LIMIT = 10;

    private final ViolationRepository violationRepository;

    @Override
    public AdminViolationStatsResponse getStats(int days) {
        Instant from = Instant.now().minus(days, ChronoUnit.DAYS);
        Pageable top = PageRequest.of(0, TOP_LIMIT);

        List<AdminViolationStatsResponse.TopViolator> topViolators =
                violationRepository.findTopViolators(from, top);

        List<AdminViolationStatsResponse.TopApp> topApps =
                violationRepository.findTopViolatedApps(from, top);

        List<AdminViolationStatsResponse.TypeCount> byType =
                violationRepository.countByTypeSince(from);

        return new AdminViolationStatsResponse(topViolators, topApps, byType);
    }

    @Override
    public PagedResponse<AdminViolationListItem> search(
            Long userId, ViolationType type, Instant from, Instant to, int page, int size
    ) {
        Page<Violation> result = violationRepository.searchViolations(
                userId, type, from, to, PageRequest.of(page, size)
        );

        List<AdminViolationListItem> items = result.getContent().stream()
                .map(v -> new AdminViolationListItem(
                        v.getId(),
                        v.getSession().getUser().getId(),
                        v.getSession().getUser().getEmail(),
                        v.getSession().getUser().getFullName(),
                        v.getType(),
                        v.getAppName(),
                        v.getWindowTitle(),
                        v.getMinutesDeducted(),
                        v.getOccurredAt()
                ))
                .toList();

        return new PagedResponse<>(
                items, result.getNumber(), result.getTotalElements(), result.getTotalPages(), result.hasNext()
        );
    }
}