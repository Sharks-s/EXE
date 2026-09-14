package com.exe101.exe.dto.response;

import com.exe101.exe.model.enums.SessionStatus;

import java.time.Instant;
import java.util.List;

public record FocusSessionResponse(
        Long id,
        String goal,
        Integer plannedDuration,
        Integer actualDuration,
        Integer totalRewardPool,
        Integer potentialReward,
        Integer accumulatedReward,
        SessionStatus status,
        Instant startedAt,
        Instant endedAt,
        Instant completedAt,
        Integer activeSeconds,
        Integer distractionCount,
        Integer distractionSeconds,
        Long userPetId,
        Long personalityId,
        Instant lastCycleAt,
        List<ViolationResponse> violations,
        Integer breakCount,
        Integer pausedMinutes,
        Integer pausedSeconds,
        Integer currentElapsedSeconds,
        Boolean wasBreakingWhenClosed,
        Integer breakRemainingSecondsAtClose
) {
}
