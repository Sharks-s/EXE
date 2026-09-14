package com.exe101.exe.service.impl;

import com.exe101.exe.model.entity.FocusSession;
import com.exe101.exe.model.enums.SessionStatus;
import com.exe101.exe.repository.FocusSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
public class FocusSessionCleanupJob {

    private static final Duration MAX_ACTIVE_SESSION_AGE = Duration.ofHours(12);

    private final FocusSessionRepository focusSessionRepository;

    @Scheduled(fixedDelayString = "${app.focus-session.cleanup-delay-ms:3600000}")
    @Transactional
    public void cancelAbandonedSessions() {
        Instant now = Instant.now();
        Instant cutoff = now.minus(MAX_ACTIVE_SESSION_AGE);
        List<FocusSession> abandonedSessions =
                focusSessionRepository.findByStatusAndStartedAtBefore(SessionStatus.IN_PROGRESS, cutoff);

        for (FocusSession session : abandonedSessions) {
            Instant effectiveEnd = session.getPausedAt() != null ? session.getPausedAt() : now;
            long wallSeconds = Math.max(0, Duration.between(session.getStartedAt(), effectiveEnd).getSeconds());
            int pausedSeconds = session.getPausedSeconds() != null
                    ? session.getPausedSeconds()
                    : Math.max(0, session.getPausedMinutes()) * 60;

            session.setActiveSeconds((int) Math.max(0, wallSeconds - pausedSeconds));
            session.setActualDuration(session.getActiveSeconds() / 60);
            session.setEndedAt(now);
            session.setStatus(SessionStatus.CANCELLED);
        }
    }
}
