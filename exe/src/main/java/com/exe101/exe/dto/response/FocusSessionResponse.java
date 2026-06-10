package com.exe101.exe.dto.response;

import com.exe101.exe.model.enums.SessionStatus;

import java.time.Instant;

public record FocusSessionResponse(
        Long id,
        Long userId,
        String goal,
        Integer plannedDuration,
        Integer actualDuration,
        Integer breakBankInitial,
        Integer breakBankFinal,
        SessionStatus status,
        Instant startedAt,
        Instant endedAt
) {
}
