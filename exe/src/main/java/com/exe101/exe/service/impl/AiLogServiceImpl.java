package com.exe101.exe.service.impl;

import com.exe101.exe.dto.response.AiLogResponse;
import com.exe101.exe.dto.response.AiLogStatsResponse;
import com.exe101.exe.dto.response.PagedResponse;
import com.exe101.exe.model.entity.AiLog;
import com.exe101.exe.model.enums.AiCallStatus;
import com.exe101.exe.model.enums.JsonParseStatus;
import com.exe101.exe.repository.AiLogRepository;
import com.exe101.exe.service.AiLogService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AiLogServiceImpl implements AiLogService {

    private final AiLogRepository aiLogRepository;

    @Override
    public PagedResponse<AiLogResponse> listLogs(
            String feature,
            AiCallStatus status,
            JsonParseStatus jsonParseStatus,
            Instant from,
            Instant to,
            int page,
            int size
    ) {
        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(1, size), 100);
        Page<AiLog> result = aiLogRepository.findAll(
                buildSpecification(feature, status, jsonParseStatus, from, to),
                PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"))
        );

        return new PagedResponse<>(
                result.getContent().stream().map(this::toResponse).toList(),
                result.getNumber(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.hasNext()
        );
    }

    @Override
    public AiLogStatsResponse getStats(int days) {
        int safeDays = Math.min(Math.max(1, days), 365);
        Instant from = Instant.now().minus(safeDays, ChronoUnit.DAYS);
        long total = aiLogRepository.countByCreatedAtGreaterThanEqual(from);
        long success = aiLogRepository.countByCreatedAtGreaterThanEqualAndStatus(from, AiCallStatus.SUCCESS);
        long failed = aiLogRepository.countByCreatedAtGreaterThanEqualAndStatus(from, AiCallStatus.FAILED);

        List<AiLogStatsResponse.FeatureCount> byFeature = aiLogRepository.countByFeatureSince(from).stream()
                .map(row -> new AiLogStatsResponse.FeatureCount(
                        row[0] == null ? "UNKNOWN" : row[0].toString(),
                        (Long) row[1]
                ))
                .toList();

        return new AiLogStatsResponse(
                safeDays,
                total,
                success,
                failed,
                aiLogRepository.countByCreatedAtGreaterThanEqualAndJsonParseStatus(from, JsonParseStatus.SUCCESS),
                aiLogRepository.countByCreatedAtGreaterThanEqualAndJsonParseStatus(from, JsonParseStatus.FAILED),
                aiLogRepository.countByCreatedAtGreaterThanEqualAndJsonParseStatus(from, JsonParseStatus.NOT_JSON),
                byFeature
        );
    }

    private Specification<AiLog> buildSpecification(
            String feature,
            AiCallStatus status,
            JsonParseStatus jsonParseStatus,
            Instant from,
            Instant to
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (feature != null && !feature.isBlank()) {
                predicates.add(cb.equal(root.get("feature"), feature.trim()));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (jsonParseStatus != null) {
                predicates.add(cb.equal(root.get("jsonParseStatus"), jsonParseStatus));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private AiLogResponse toResponse(AiLog log) {
        return new AiLogResponse(
                log.getId(),
                log.getProvider(),
                log.getModel(),
                log.getFeature(),
                log.getPromptName(),
                log.getStatus(),
                log.getJsonParseStatus(),
                log.getJsonParseError(),
                log.getInputTokens(),
                log.getOutputTokens(),
                log.getTotalTokens(),
                log.getCostUsd(),
                log.getLatencyMs(),
                log.getErrorMessage(),
                log.getCreatedAt()
        );
    }
}
