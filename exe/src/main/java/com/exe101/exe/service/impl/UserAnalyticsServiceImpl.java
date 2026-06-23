package com.exe101.exe.service.impl;

import com.exe101.exe.dto.response.AnalyticsComparisonResponse;
import com.exe101.exe.dto.response.AnalyticsSummaryResponse;
import com.exe101.exe.dto.response.CalendarAnalyticsItem;
import com.exe101.exe.dto.response.CalendarAnalyticsResponse;
import com.exe101.exe.dto.response.FocusTimeChartItem;
import com.exe101.exe.dto.response.FocusTimeChartResponse;
import com.exe101.exe.dto.response.GoalAnalyticsItem;
import com.exe101.exe.dto.response.GoalAnalyticsResponse;
import com.exe101.exe.dto.response.HourlyAnalyticsItem;
import com.exe101.exe.dto.response.HourlyAnalyticsResponse;
import com.exe101.exe.dto.response.TopViolationAppItem;
import com.exe101.exe.dto.response.ViolationAnalyticsResponse;
import com.exe101.exe.dto.response.ViolationTypeAnalyticsItem;
import com.exe101.exe.model.entity.FocusSession;
import com.exe101.exe.model.entity.Violation;
import com.exe101.exe.model.enums.AnalyticsRange;
import com.exe101.exe.model.enums.SessionStatus;
import com.exe101.exe.model.enums.ViolationType;
import com.exe101.exe.repository.FocusSessionRepository;
import com.exe101.exe.repository.ViolationRepository;
import com.exe101.exe.service.UserAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserAnalyticsServiceImpl implements UserAnalyticsService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final String UNNAMED_GOAL = "No goal";

    private final FocusSessionRepository focusSessionRepository;
    private final ViolationRepository violationRepository;

    @Override
    public AnalyticsSummaryResponse getSummary(Long userId, AnalyticsRange range, LocalDate from, LocalDate to) {
        DateRange currentRange = resolveRange(range, from, to);
        DateRange previousRange = previousRange(currentRange);

        List<FocusSession> sessions = loadSessions(userId, currentRange);
        List<Violation> violations = loadViolations(userId, currentRange);
        List<FocusSession> previousSessions = loadSessions(userId, previousRange);
        List<Violation> previousViolations = loadViolations(userId, previousRange);

        int totalSessions = sessions.size();
        int completedSessions = countStatus(sessions, SessionStatus.COMPLETED);
        int abortedSessions = countStatus(sessions, SessionStatus.ABORTED);
        int cancelledSessions = countStatus(sessions, SessionStatus.CANCELLED);
        int totalFocusMinutes = totalFocusMinutes(sessions);
        int previousFocusMinutes = totalFocusMinutes(previousSessions);

        return AnalyticsSummaryResponse.builder()
                .totalFocusMinutes(totalFocusMinutes)
                .totalFocusHours(round(totalFocusMinutes / 60.0))
                .totalSessions(totalSessions)
                .completedSessions(completedSessions)
                .abortedSessions(abortedSessions)
                .cancelledSessions(cancelledSessions)
                .completionRate(totalSessions == 0 ? 0.0 : round(completedSessions * 100.0 / totalSessions))
                .averageSessionMinutes(totalSessions == 0 ? 0.0 : round(totalFocusMinutes * 1.0 / totalSessions))
                .totalBreakMinutes(sessions.stream().mapToInt(this::safePausedMinutes).sum())
                .totalViolations(violations.size())
                .currentStreakDays(currentStreakDays(userId))
                .longestStreakDays(longestStreakDays(userId))
                .compareWithPreviousRange(AnalyticsComparisonResponse.builder()
                        .focusMinutesDiff(totalFocusMinutes - previousFocusMinutes)
                        .focusMinutesPercent(percentDiff(totalFocusMinutes, previousFocusMinutes))
                        .sessionsDiff(totalSessions - previousSessions.size())
                        .violationsDiff(violations.size() - previousViolations.size())
                        .build())
                .build();
    }

    @Override
    public FocusTimeChartResponse getFocusTime(Long userId, AnalyticsRange range, LocalDate from, LocalDate to) {
        DateRange dateRange = resolveRange(range, from, to);
        List<FocusSession> sessions = loadSessions(userId, dateRange);

        Map<LocalDate, List<FocusSession>> byDate = sessions.stream()
                .collect(Collectors.groupingBy(
                        session -> toLocalDate(session.getStartedAt()),
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        List<FocusTimeChartItem> items = new ArrayList<>();
        for (LocalDate date = dateRange.from(); date.isBefore(dateRange.to()); date = date.plusDays(1)) {
            List<FocusSession> daySessions = byDate.getOrDefault(date, List.of());
            items.add(FocusTimeChartItem.builder()
                    .date(date)
                    .focusMinutes(totalFocusMinutes(daySessions))
                    .completedSessions(countStatus(daySessions, SessionStatus.COMPLETED))
                    .abortedSessions(countStatus(daySessions, SessionStatus.ABORTED))
                    .build());
        }

        return FocusTimeChartResponse.builder()
                .unit("DAY")
                .items(items)
                .build();
    }

    @Override
    public HourlyAnalyticsResponse getHourlyAnalytics(Long userId, AnalyticsRange range, LocalDate from, LocalDate to) {
        DateRange dateRange = resolveRange(range, from, to);
        List<FocusSession> sessions = loadSessions(userId, dateRange);

        Map<Integer, HourBucket> buckets = new HashMap<>();
        for (FocusSession session : sessions) {
            int hour = session.getStartedAt().atZone(VN_ZONE).getHour();
            HourBucket bucket = buckets.computeIfAbsent(hour, ignored -> new HourBucket());
            bucket.focusMinutes += focusMinutes(session);
            bucket.sessions++;
        }

        List<HourlyAnalyticsItem> items = buckets.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> HourlyAnalyticsItem.builder()
                        .hour(entry.getKey())
                        .focusMinutes(entry.getValue().focusMinutes)
                        .sessions(entry.getValue().sessions)
                        .build())
                .toList();

        Integer bestHour = items.stream()
                .max(Comparator.comparing(HourlyAnalyticsItem::getFocusMinutes))
                .map(HourlyAnalyticsItem::getHour)
                .orElse(null);

        return HourlyAnalyticsResponse.builder()
                .items(items)
                .bestHour(bestHour)
                .build();
    }

    @Override
    public GoalAnalyticsResponse getGoalAnalytics(Long userId, AnalyticsRange range, LocalDate from, LocalDate to) {
        DateRange dateRange = resolveRange(range, from, to);
        List<FocusSession> sessions = loadSessions(userId, dateRange);

        Map<String, List<FocusSession>> byGoal = sessions.stream()
                .collect(Collectors.groupingBy(session -> normalizeGoal(session.getGoal())));

        List<GoalAnalyticsItem> items = byGoal.entrySet().stream()
                .map(entry -> {
                    List<FocusSession> goalSessions = entry.getValue();
                    int sessionCount = goalSessions.size();
                    int completed = countStatus(goalSessions, SessionStatus.COMPLETED);
                    return GoalAnalyticsItem.builder()
                            .goal(entry.getKey())
                            .focusMinutes(totalFocusMinutes(goalSessions))
                            .sessions(sessionCount)
                            .completionRate(sessionCount == 0 ? 0.0 : round(completed * 100.0 / sessionCount))
                            .build();
                })
                .sorted(Comparator.comparing(GoalAnalyticsItem::getFocusMinutes).reversed())
                .toList();

        return GoalAnalyticsResponse.builder()
                .items(items)
                .build();
    }

    @Override
    public ViolationAnalyticsResponse getViolationAnalytics(Long userId, AnalyticsRange range, LocalDate from, LocalDate to) {
        DateRange dateRange = resolveRange(range, from, to);
        List<Violation> violations = loadViolations(userId, dateRange);

        Map<ViolationType, ViolationBucket> byType = new EnumMap<>(ViolationType.class);
        Map<String, Integer> byApp = new HashMap<>();

        for (Violation violation : violations) {
            ViolationBucket bucket = byType.computeIfAbsent(violation.getType(), ignored -> new ViolationBucket());
            bucket.count++;
            bucket.minutesDeducted += violation.getMinutesDeducted();

            if (violation.getAppName() != null && !violation.getAppName().isBlank()) {
                byApp.merge(violation.getAppName().trim(), 1, Integer::sum);
            }
        }

        List<ViolationTypeAnalyticsItem> typeItems = byType.entrySet().stream()
                .map(entry -> ViolationTypeAnalyticsItem.builder()
                        .type(entry.getKey())
                        .count(entry.getValue().count)
                        .minutesDeducted(entry.getValue().minutesDeducted)
                        .build())
                .sorted(Comparator.comparing(ViolationTypeAnalyticsItem::getCount).reversed())
                .toList();

        List<TopViolationAppItem> topApps = byApp.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(5)
                .map(entry -> TopViolationAppItem.builder()
                        .appName(entry.getKey())
                        .count(entry.getValue())
                        .build())
                .toList();

        return ViolationAnalyticsResponse.builder()
                .totalViolations(violations.size())
                .penaltyMinutes(violations.stream().mapToInt(Violation::getMinutesDeducted).sum())
                .byType(typeItems)
                .topApps(topApps)
                .build();
    }

    @Override
    public CalendarAnalyticsResponse getCalendar(Long userId, int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        DateRange dateRange = new DateRange(yearMonth.atDay(1), yearMonth.plusMonths(1).atDay(1));
        List<FocusSession> sessions = loadSessions(userId, dateRange);

        Map<LocalDate, List<FocusSession>> byDate = sessions.stream()
                .collect(Collectors.groupingBy(session -> toLocalDate(session.getStartedAt())));

        List<CalendarAnalyticsItem> items = new ArrayList<>();
        for (int day = 1; day <= yearMonth.lengthOfMonth(); day++) {
            LocalDate date = yearMonth.atDay(day);
            List<FocusSession> daySessions = byDate.getOrDefault(date, List.of());
            int focusMinutes = totalFocusMinutes(daySessions);
            items.add(CalendarAnalyticsItem.builder()
                    .date(date)
                    .focusMinutes(focusMinutes)
                    .sessions(daySessions.size())
                    .level(calendarLevel(focusMinutes))
                    .build());
        }

        return CalendarAnalyticsResponse.builder()
                .year(year)
                .month(month)
                .items(items)
                .build();
    }

    private List<FocusSession> loadSessions(Long userId, DateRange range) {
        return focusSessionRepository.findByUserIdAndStartedAtGreaterThanEqualAndStartedAtLessThanOrderByStartedAtAsc(
                userId,
                toStartInstant(range.from()),
                toStartInstant(range.to())
        );
    }

    private List<Violation> loadViolations(Long userId, DateRange range) {
        return violationRepository.findBySessionUserIdAndOccurredAtGreaterThanEqualAndOccurredAtLessThan(
                userId,
                toStartInstant(range.from()),
                toStartInstant(range.to())
        );
    }

    private DateRange resolveRange(AnalyticsRange range, LocalDate from, LocalDate to) {
        AnalyticsRange effectiveRange = range == null ? AnalyticsRange.WEEK : range;
        LocalDate today = LocalDate.now(VN_ZONE);

        if (effectiveRange == AnalyticsRange.CUSTOM) {
            LocalDate customFrom = from == null ? today : from;
            LocalDate customTo = to == null ? customFrom : to;
            if (customTo.isBefore(customFrom)) {
                customTo = customFrom;
            }
            return new DateRange(customFrom, customTo.plusDays(1));
        }

        return switch (effectiveRange) {
            case DAY -> new DateRange(today, today.plusDays(1));
            case WEEK -> new DateRange(today.minusDays(6), today.plusDays(1));
            case MONTH -> {
                YearMonth month = YearMonth.from(today);
                yield new DateRange(month.atDay(1), month.plusMonths(1).atDay(1));
            }
            case YEAR -> new DateRange(today.withDayOfYear(1), today.plusYears(1).withDayOfYear(1));
            case CUSTOM -> throw new IllegalStateException("CUSTOM range is handled above");
        };
    }

    private DateRange previousRange(DateRange range) {
        long days = ChronoUnit.DAYS.between(range.from(), range.to());
        return new DateRange(range.from().minusDays(days), range.from());
    }

    private int currentStreakDays(Long userId) {
        LocalDate tomorrow = LocalDate.now(VN_ZONE).plusDays(1);
        DateRange allRange = new DateRange(LocalDate.of(1970, 1, 1), tomorrow);
        Set<LocalDate> activeDays = activeDays(loadSessions(userId, allRange));

        int streak = 0;
        LocalDate cursor = tomorrow.minusDays(1);
        while (activeDays.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }

    private int longestStreakDays(Long userId) {
        LocalDate tomorrow = LocalDate.now(VN_ZONE).plusDays(1);
        DateRange allRange = new DateRange(LocalDate.of(1970, 1, 1), tomorrow);
        List<LocalDate> days = activeDays(loadSessions(userId, allRange)).stream()
                .sorted()
                .toList();

        int longest = 0;
        int current = 0;
        LocalDate previous = null;
        for (LocalDate day : days) {
            if (previous != null && day.equals(previous.plusDays(1))) {
                current++;
            } else {
                current = 1;
            }
            longest = Math.max(longest, current);
            previous = day;
        }
        return longest;
    }

    private Set<LocalDate> activeDays(List<FocusSession> sessions) {
        Set<LocalDate> days = new HashSet<>();
        for (FocusSession session : sessions) {
            if (focusMinutes(session) > 0) {
                days.add(toLocalDate(session.getStartedAt()));
            }
        }
        return days;
    }

    private int totalFocusMinutes(List<FocusSession> sessions) {
        return sessions.stream().mapToInt(this::focusMinutes).sum();
    }

    private int focusMinutes(FocusSession session) {
        if (session.getActualDuration() != null) {
            return Math.max(0, session.getActualDuration());
        }
        if (session.getStatus() == SessionStatus.COMPLETED) {
            return safePlannedDuration(session);
        }
        return 0;
    }

    private int countStatus(List<FocusSession> sessions, SessionStatus status) {
        return (int) sessions.stream()
                .filter(session -> session.getStatus() == status)
                .count();
    }

    private int safePausedMinutes(FocusSession session) {
        return session.getPausedMinutes() == null ? 0 : Math.max(0, session.getPausedMinutes());
    }

    private int safePlannedDuration(FocusSession session) {
        return session.getPlannedDuration() == null ? 0 : Math.max(0, session.getPlannedDuration());
    }

    private LocalDate toLocalDate(Instant instant) {
        return instant.atZone(VN_ZONE).toLocalDate();
    }

    private Instant toStartInstant(LocalDate date) {
        return date.atStartOfDay(VN_ZONE).toInstant();
    }

    private String normalizeGoal(String goal) {
        if (goal == null || goal.isBlank()) {
            return UNNAMED_GOAL;
        }
        return goal.trim();
    }

    private int calendarLevel(int focusMinutes) {
        if (focusMinutes <= 0) return 0;
        if (focusMinutes <= 25) return 1;
        if (focusMinutes <= 60) return 2;
        if (focusMinutes <= 120) return 3;
        return 4;
    }

    private Double percentDiff(int current, int previous) {
        if (previous == 0) {
            return current == 0 ? 0.0 : 100.0;
        }
        return round((current - previous) * 100.0 / previous);
    }

    private Double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private record DateRange(LocalDate from, LocalDate to) {
    }

    private static class HourBucket {
        private int focusMinutes;
        private int sessions;
    }

    private static class ViolationBucket {
        private int count;
        private int minutesDeducted;
    }
}
