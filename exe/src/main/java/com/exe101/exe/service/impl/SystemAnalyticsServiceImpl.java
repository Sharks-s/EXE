package com.exe101.exe.service.impl;

import com.exe101.exe.dto.response.SystemAnalyticsResponse;
import com.exe101.exe.model.entity.FocusSession;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.enums.SessionStatus;
import com.exe101.exe.repository.FocusSessionRepository;
import com.exe101.exe.repository.UserRepository;
import com.exe101.exe.service.SystemAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SystemAnalyticsServiceImpl implements SystemAnalyticsService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final UserRepository userRepository;
    private final FocusSessionRepository focusSessionRepository;

    @Override
    public SystemAnalyticsResponse getSystemAnalytics(int days) {
        int safeDays = Math.min(Math.max(1, days), 365);
        LocalDate today = LocalDate.now(VN_ZONE);
        LocalDate fromDate = today.minusDays(safeDays - 1L);
        LocalDate toDateExclusive = today.plusDays(1);
        Instant from = fromDate.atStartOfDay(VN_ZONE).toInstant();
        Instant to = toDateExclusive.atStartOfDay(VN_ZONE).toInstant();

        List<FocusSession> sessions = focusSessionRepository.findByStartedAtGreaterThanEqualAndStartedAtLessThanOrderByStartedAtAsc(from, to);
        long totalUsers = userRepository.count();
        Set<Long> activeUserIds = sessions.stream()
                .map(session -> session.getUser().getId())
                .collect(Collectors.toSet());
        long startedSessions = sessions.size();
        long completedSessions = sessions.stream()
                .filter(session -> session.getStatus() == SessionStatus.COMPLETED)
                .count();

        SystemAnalyticsResponse.Summary summary = new SystemAnalyticsResponse.Summary(
                totalUsers,
                activeUserIds.size(),
                startedSessions,
                completedSessions,
                percent(completedSessions, startedSessions),
                totalUsers == 0 ? 0.0 : round(activeUserIds.size() * 100.0 / totalUsers),
                averageSessionMinutes(sessions)
        );

        return new SystemAnalyticsResponse(
                summary,
                hourlyStudy(sessions),
                retention(from, to),
                completionTrend(sessions, fromDate, toDateExclusive)
        );
    }

    private List<SystemAnalyticsResponse.HourlyStudy> hourlyStudy(List<FocusSession> sessions) {
        Map<Integer, HourBucket> buckets = new HashMap<>();
        for (FocusSession session : sessions) {
            int hour = session.getStartedAt().atZone(VN_ZONE).getHour();
            HourBucket bucket = buckets.computeIfAbsent(hour, ignored -> new HourBucket());
            bucket.sessions++;
            bucket.focusMinutes += focusMinutes(session);
            bucket.userIds.add(session.getUser().getId());
        }
        return buckets.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> new SystemAnalyticsResponse.HourlyStudy(
                        entry.getKey(),
                        entry.getValue().userIds.size(),
                        entry.getValue().sessions,
                        entry.getValue().focusMinutes
                ))
                .toList();
    }

    private List<SystemAnalyticsResponse.RetentionPoint> retention(Instant from, Instant to) {
        List<User> cohortUsers = userRepository.findByCreatedAtGreaterThanEqualAndCreatedAtLessThan(from, to);
        if (cohortUsers.isEmpty()) {
            return List.of(new SystemAnalyticsResponse.RetentionPoint("D1", 0, 0, 0.0));
        }

        Map<Long, User> usersById = cohortUsers.stream().collect(Collectors.toMap(User::getId, user -> user));
        List<FocusSession> sessions = focusSessionRepository.findByStartedAtGreaterThanEqualAndStartedAtLessThanOrderByStartedAtAsc(from, to);

        return List.of(1, 7, 30).stream()
                .map(day -> {
                    long retained = sessions.stream()
                            .filter(session -> usersById.containsKey(session.getUser().getId()))
                            .filter(session -> ChronoUnit.DAYS.between(
                                    usersById.get(session.getUser().getId()).getCreatedAt().atZone(VN_ZONE).toLocalDate(),
                                    session.getStartedAt().atZone(VN_ZONE).toLocalDate()) >= day)
                            .map(session -> session.getUser().getId())
                            .distinct()
                            .count();
                    return new SystemAnalyticsResponse.RetentionPoint(
                            "D" + day,
                            cohortUsers.size(),
                            retained,
                            percent(retained, cohortUsers.size())
                    );
                })
                .toList();
    }

    private List<SystemAnalyticsResponse.CompletionTrendPoint> completionTrend(
            List<FocusSession> sessions,
            LocalDate fromDate,
            LocalDate toDateExclusive
    ) {
        Map<LocalDate, List<FocusSession>> byDate = sessions.stream()
                .collect(Collectors.groupingBy(session -> session.getStartedAt().atZone(VN_ZONE).toLocalDate()));

        List<SystemAnalyticsResponse.CompletionTrendPoint> items = new ArrayList<>();
        for (LocalDate date = fromDate; date.isBefore(toDateExclusive); date = date.plusDays(1)) {
            List<FocusSession> daySessions = byDate.getOrDefault(date, List.of());
            long started = daySessions.size();
            long completed = daySessions.stream()
                    .filter(session -> session.getStatus() == SessionStatus.COMPLETED)
                    .count();
            items.add(new SystemAnalyticsResponse.CompletionTrendPoint(date, started, completed, percent(completed, started)));
        }
        return items;
    }

    private double averageSessionMinutes(List<FocusSession> sessions) {
        if (sessions.isEmpty()) {
            return 0.0;
        }
        return round(sessions.stream().mapToInt(this::focusMinutes).average().orElse(0.0));
    }

    private int focusMinutes(FocusSession session) {
        if (session.getActiveSeconds() != null && session.getActiveSeconds() > 0) {
            return session.getActiveSeconds() / 60;
        }
        if (session.getActualDuration() != null) {
            return Math.max(0, session.getActualDuration());
        }
        if (session.getStatus() == SessionStatus.COMPLETED && session.getPlannedDuration() != null) {
            return Math.max(0, session.getPlannedDuration());
        }
        return 0;
    }

    private double percent(long numerator, long denominator) {
        return denominator == 0 ? 0.0 : round(numerator * 100.0 / denominator);
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private static class HourBucket {
        private long sessions;
        private int focusMinutes;
        private final Set<Long> userIds = new HashSet<>();
    }
}
