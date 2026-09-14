package com.exe101.exe.service.impl;

import com.exe101.exe.config.AppSeedProperties;
import com.exe101.exe.dto.response.AchievementResponse;
import com.exe101.exe.dto.response.UnlockedAchievementResponse;
import com.exe101.exe.model.entity.Achievement;
import com.exe101.exe.model.entity.FocusSession;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.entity.UserAchievement;
import com.exe101.exe.model.enums.AchievementCategory;
import com.exe101.exe.model.enums.AchievementRarity;
import com.exe101.exe.model.enums.PointTransactionType;
import com.exe101.exe.model.enums.SessionStatus;
import com.exe101.exe.model.enums.UserAchievementStatus;
import com.exe101.exe.model.enums.ViolationType;
import com.exe101.exe.repository.AchievementRepository;
import com.exe101.exe.repository.FocusSessionRepository;
import com.exe101.exe.repository.UserAchievementRepository;
import com.exe101.exe.service.AchievementService;
import com.exe101.exe.service.PointService;
import com.exe101.exe.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AchievementServiceImpl implements AchievementService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final FocusSessionRepository focusSessionRepository;
    private final UserService userService;
    private final PointService pointService;
    private final AppSeedProperties appSeedProperties;

    @Override
    public List<AchievementResponse> getAllAchievements(Long userId) {
        return buildResponses(userId, achievementRepository.findByActiveTrueOrderByCategoryAscTargetValueAsc());
    }

    @Override
    public List<AchievementResponse> getMyAchievements(Long userId) {
        return buildResponses(userId, achievementRepository.findByActiveTrueOrderByCategoryAscTargetValueAsc());
    }

    @Override
    public List<AchievementResponse> getMyProgress(Long userId) {
        return getMyAchievements(userId);
    }

    @Override
    @Transactional
    public List<UnlockedAchievementResponse> checkSessionCompletedAchievements(Long userId) {
        List<Achievement> achievements = achievementRepository.findByActiveTrueAndCategoryInOrderByCategoryAscTargetValueAsc(
                EnumSet.of(
                        AchievementCategory.SESSION,
                        AchievementCategory.FOCUS_TIME,
                        AchievementCategory.STREAK,
                        AchievementCategory.MILESTONE,
                        AchievementCategory.BEHAVIORAL
                )
        );
        Map<Long, UserAchievement> existing = loadExistingForUpdate(userId, achievements);
        User user = userService.findById(userId);
        int completedSessions = Math.toIntExact(focusSessionRepository.countByUserIdAndStatus(userId, SessionStatus.COMPLETED));
        int focusMinutes = focusSessionRepository.sumDurationByUserIdAndStatus(userId, SessionStatus.COMPLETED);
        int streakDays = getCurrentStreakDays(userId);
        SessionAchievementMetrics metrics = loadSessionMetrics(user, completedSessions);

        return achievements.stream()
                .map(achievement -> updateProgress(user, achievement, existing.get(achievement.getId()),
                        progressFor(achievement, completedSessions, focusMinutes, streakDays, metrics)))
                .filter(result -> result != null)
                .toList();
    }

    @Override
    public int getCurrentStreakDays(Long userId) {
        User user = userService.findById(userId);
        ZoneId zone = resolveUserZone(user);
        LocalDate tomorrow = LocalDate.now(zone).plusDays(1);
        List<FocusSession> sessions = focusSessionRepository
                .findByUserIdAndStartedAtGreaterThanEqualAndStartedAtLessThanOrderByStartedAtAsc(
                        userId,
                        LocalDate.of(1970, 1, 1).atStartOfDay(zone).toInstant(),
                        tomorrow.atStartOfDay(zone).toInstant()
                );

        Set<LocalDate> activeDays = new HashSet<>();
        for (FocusSession session : sessions) {
            if (session.getStatus() == SessionStatus.COMPLETED && focusMinutes(session) >= 25) {
                activeDays.add(session.getStartedAt().atZone(zone).toLocalDate());
            }
        }

        int streak = 0;
        LocalDate cursor = tomorrow.minusDays(1);
        while (activeDays.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }

    @Override
    @Transactional
    public void seedDefaultAchievements() {
        if (appSeedProperties.getAchievements() != null && !appSeedProperties.getAchievements().isEmpty()) {
            appSeedProperties.getAchievements().forEach(seed -> seed(
                    seed.getCode(),
                    seed.getName(),
                    seed.getDescription(),
                    seed.getIcon(),
                    seed.getCategory(),
                    seed.getRarity(),
                    seed.getTargetValue(),
                    seed.getRewardPoints(),
                    seed.getActive() == null || seed.getActive()
            ));
            return;
        }

        // Chuỗi 1: Thời gian tập trung
        seed("FOCUS_START_SERIOUS", "Khởi đầu nghiêm túc", "Hoàn thành phiên tập trung đầu tiên.", "flag",
                AchievementCategory.FOCUS_TIME, AchievementRarity.COMMON, 1, 20);
        seed("FOCUS_RHYTHM_KEEPER", "Người giữ nhịp", "Tập trung tổng cộng 5 giờ.", "timer",
                AchievementCategory.FOCUS_TIME, AchievementRarity.RARE, 300, 80);
        seed("FOCUS_MASTER", "Bậc thầy tập trung", "Tập trung tổng cộng 25 giờ.", "hourglass",
                AchievementCategory.FOCUS_TIME, AchievementRarity.EPIC, 1500, 180);
        seed("FOCUS_STEEL_DISCIPLINE", "Kỷ luật thép", "Tập trung tổng cộng 100 giờ.", "workspace_premium",
                AchievementCategory.FOCUS_TIME, AchievementRarity.LEGENDARY, 6000, 500);
        seed("FOCUS_LEGEND", "Huyền thoại tập trung", "Tập trung tổng cộng 500 giờ.", "emoji_events",
                AchievementCategory.FOCUS_TIME, AchievementRarity.LEGENDARY, 30000, 1000);

        // Chuỗi 2: Phiên làm việc hoàn hảo
        seed("PERFECT_SESSION_1", "Không một lần xao nhãng", "Hoàn thành 1 phiên hoàn hảo.", "shield",
                AchievementCategory.BEHAVIORAL, AchievementRarity.COMMON, 1, 30);
        seed("PERFECT_SESSION_5", "Tâm trí vững vàng", "Hoàn thành 5 phiên hoàn hảo.", "verified",
                AchievementCategory.BEHAVIORAL, AchievementRarity.RARE, 5, 80);
        seed("PERFECT_SESSION_20", "Chế độ chuyên tâm", "Hoàn thành 20 phiên hoàn hảo.", "psychology",
                AchievementCategory.BEHAVIORAL, AchievementRarity.EPIC, 20, 180);
        seed("PERFECT_SESSION_50", "Không thể lay chuyển", "Hoàn thành 50 phiên hoàn hảo.", "fort",
                AchievementCategory.BEHAVIORAL, AchievementRarity.EPIC, 50, 300);
        seed("PERFECT_SESSION_100", "Tập trung tuyệt đối", "Hoàn thành 100 phiên hoàn hảo.", "diamond",
                AchievementCategory.BEHAVIORAL, AchievementRarity.LEGENDARY, 100, 700);

        // Chuỗi 3: Streak hằng ngày
        seed("STREAK_1_DAY", "Ngày đầu tiên", "Streak 1 ngày.", "local_fire_department",
                AchievementCategory.STREAK, AchievementRarity.COMMON, 1, 10);
        seed("STREAK_3_DAYS", "Không bỏ cuộc", "Streak 3 ngày.", "local_fire_department",
                AchievementCategory.STREAK, AchievementRarity.COMMON, 3, 30);
        seed("STREAK_7_DAYS", "Một tuần kỷ luật", "Streak 7 ngày.", "whatshot",
                AchievementCategory.STREAK, AchievementRarity.RARE, 7, 70);
        seed("STREAK_21_DAYS", "Thói quen mới", "Streak 21 ngày.", "routine",
                AchievementCategory.STREAK, AchievementRarity.EPIC, 21, 180);
        seed("STREAK_30_DAYS", "Kỷ luật trở thành bản năng", "Streak 30 ngày.", "military_tech",
                AchievementCategory.STREAK, AchievementRarity.LEGENDARY, 30, 350);
        seed("STREAK_100_DAYS", "Trăm ngày tiến bộ", "Streak 100 ngày.", "emoji_events",
                AchievementCategory.STREAK, AchievementRarity.LEGENDARY, 100, 1000);

        // Chuỗi 4: Bảo vệ Quỹ giải lao
        seed("BREAK_FUND_KEEP_REWARD", "Biết giữ phần thưởng", "Kết thúc phiên với quỹ nghỉ lớn hơn 0.", "savings",
                AchievementCategory.BEHAVIORAL, AchievementRarity.COMMON, 1, 20);
        seed("BREAK_FUND_80_5", "Người quản lý thời gian", "Giữ ít nhất 80% quỹ trong 5 phiên.", "manage_history",
                AchievementCategory.BEHAVIORAL, AchievementRarity.RARE, 5, 80);
        seed("BREAK_FUND_100_10", "Không lãng phí phút nào", "Giữ 100% quỹ trong 10 phiên.", "all_inclusive",
                AchievementCategory.BEHAVIORAL, AchievementRarity.EPIC, 10, 180);
        seed("BREAK_FUND_AVG_90_30", "Chủ nhân thời gian", "Giữ trung bình 90% quỹ trong 30 phiên.", "schedule",
                AchievementCategory.BEHAVIORAL, AchievementRarity.EPIC, 30, 250);

        // Chuỗi 5: Vượt qua điện thoại
        seed("PHONE_DOWN_1", "Đặt điện thoại xuống", "Hoàn thành 1 phiên không dùng điện thoại.", "phone_disabled",
                AchievementCategory.BEHAVIORAL, AchievementRarity.COMMON, 1, 20);
        seed("PHONE_STREAK_5", "Không còn lệ thuộc", "5 phiên liên tiếp không dùng điện thoại.", "phonelink_erase",
                AchievementCategory.BEHAVIORAL, AchievementRarity.RARE, 5, 80);
        seed("PHONE_FREE_20", "Chiến thắng cám dỗ", "20 phiên không dùng điện thoại.", "do_not_disturb_on",
                AchievementCategory.BEHAVIORAL, AchievementRarity.EPIC, 20, 180);
        seed("PHONE_FREE_50", "Điện thoại không điều khiển tôi", "50 phiên không dùng điện thoại.", "mobile_off",
                AchievementCategory.BEHAVIORAL, AchievementRarity.EPIC, 50, 300);

        // Chuỗi 6: Kiểm soát ứng dụng giải trí
        seed("ENTERTAINMENT_BACK_ON_TRACK", "Đóng tab lại", "Tự quay về công việc sau một lời nhắc.", "tab_close",
                AchievementCategory.BEHAVIORAL, AchievementRarity.COMMON, 1, 20);
        seed("ENTERTAINMENT_CLEAN_5", "Biết mình đang làm gì", "5 phiên không mở ứng dụng giải trí.", "web_asset_off",
                AchievementCategory.BEHAVIORAL, AchievementRarity.RARE, 5, 80);
        seed("ENTERTAINMENT_CLEAN_20", "Không còn lạc hướng", "20 phiên sạch.", "explore_off",
                AchievementCategory.BEHAVIORAL, AchievementRarity.EPIC, 20, 180);
        seed("ENTERTAINMENT_CLEAN_50", "Làm chủ màn hình", "50 phiên sạch.", "desktop_windows",
                AchievementCategory.BEHAVIORAL, AchievementRarity.EPIC, 50, 300);

        // Chuỗi 7: Khả năng phục hồi
        seed("RECOVERY_BACK_ON_TRACK", "Quay lại đường đua", "Tiếp tục tập trung trong 2 phút sau cảnh báo.", "restart_alt",
                AchievementCategory.BEHAVIORAL, AchievementRarity.COMMON, 1, 20);
        seed("RECOVERY_5", "Vấp ngã nhưng không bỏ cuộc", "Phục hồi thành công 5 lần.", "healing",
                AchievementCategory.BEHAVIORAL, AchievementRarity.RARE, 5, 80);
        seed("RECOVERY_20", "Tự kéo mình trở lại", "Phục hồi thành công 20 lần.", "self_improvement",
                AchievementCategory.BEHAVIORAL, AchievementRarity.EPIC, 20, 180);
        seed("RECOVERY_50", "Ý chí không thể đánh bại", "Phục hồi thành công 50 lần.", "fitness_center",
                AchievementCategory.BEHAVIORAL, AchievementRarity.EPIC, 50, 300);

        // Chuỗi 8: Cột mốc đặc biệt
        seed("MILESTONE_EARLY_MORNING", "Sáng sớm rõ ràng", "Hoàn thành phiên lúc sáng sớm.", "wb_sunny",
                AchievementCategory.MILESTONE, AchievementRarity.COMMON, 1, 20);
        seed("MILESTONE_90_MIN_SESSION", "Chín mươi phút sâu", "Hoàn thành phiên tập trung dài 90 phút.", "timer",
                AchievementCategory.MILESTONE, AchievementRarity.RARE, 1, 60);
        seed("MILESTONE_RETURN_AFTER_7_DAYS", "Trở lại sau im lặng", "Quay lại sau 7 ngày không sử dụng ứng dụng.", "event_repeat",
                AchievementCategory.MILESTONE, AchievementRarity.RARE, 1, 60);
        seed("MILESTONE_WEEKLY_GOAL", "Giữ lời hứa tuần này", "Hoàn thành mục tiêu tuần.", "calendar_month",
                AchievementCategory.MILESTONE, AchievementRarity.RARE, 1, 80);
        seed("MILESTONE_ALL_PERSONALITIES", "Hiểu mọi người bạn đồng hành", "Sử dụng đủ các tính cách trợ lý.", "diversity_3",
                AchievementCategory.MILESTONE, AchievementRarity.EPIC, 1, 180);
        seed("MILESTONE_LAST_BREAK_MINUTE", "Một phút cuối cùng", "Hoàn thành phiên khi quỹ giải lao chỉ còn 1 phút.", "hourglass_bottom",
                AchievementCategory.MILESTONE, AchievementRarity.COMMON, 1, 30);
    }

    private List<AchievementResponse> buildResponses(Long userId, List<Achievement> achievements) {
        Map<Long, UserAchievement> existing = loadExisting(userId, achievements);
        return achievements.stream()
                .map(achievement -> toResponse(achievement, existing.get(achievement.getId())))
                .toList();
    }

    private Map<Long, UserAchievement> loadExisting(Long userId, List<Achievement> achievements) {
        List<Long> ids = achievements.stream().map(Achievement::getId).toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        Map<Long, UserAchievement> existing = new HashMap<>();
        userAchievementRepository.findByUserIdAndAchievementIdInWithAchievement(userId, ids)
                .forEach(userAchievement -> existing.put(userAchievement.getAchievement().getId(), userAchievement));
        return existing;
    }

    private Map<Long, UserAchievement> loadExistingForUpdate(Long userId, List<Achievement> achievements) {
        List<Long> ids = achievements.stream().map(Achievement::getId).toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        Map<Long, UserAchievement> existing = new HashMap<>();
        userAchievementRepository.findByUserIdAndAchievementIdInWithAchievementForUpdate(userId, ids)
                .forEach(userAchievement -> existing.put(userAchievement.getAchievement().getId(), userAchievement));
        return existing;
    }

    private UnlockedAchievementResponse updateProgress(
            User user,
            Achievement achievement,
            UserAchievement userAchievement,
            int progress
    ) {
        if (userAchievement == null) {
            userAchievement = UserAchievement.builder()
                    .user(user)
                    .achievement(achievement)
                    .progress(0)
                    .targetValue(achievement.getTargetValue())
                    .status(UserAchievementStatus.LOCKED)
                    .build();
        }

        if (userAchievement.getStatus() == UserAchievementStatus.UNLOCKED) {
            return null;
        }

        userAchievement.setProgress(Math.min(progress, userAchievement.getTargetValue()));
        if (progress >= userAchievement.getTargetValue()) {
            userAchievement.setStatus(UserAchievementStatus.UNLOCKED);
            userAchievement.setUnlockedAt(Instant.now());
            try {
                userAchievementRepository.saveAndFlush(userAchievement);
            } catch (DataIntegrityViolationException ex) {
                return null;
            }
            pointService.creditWallet(
                    user.getId(),
                    achievement.getRewardPoints(),
                    PointTransactionType.ACHIEVEMENT_REWARD,
                    "Achievement unlocked: " + achievement.getCode(),
                    String.valueOf(achievement.getId())
            );
            return new UnlockedAchievementResponse(
                    achievement.getCode(),
                    achievement.getName(),
                    achievement.getRewardPoints()
            );
        }

        if (progress > 0) {
            userAchievement.setStatus(UserAchievementStatus.IN_PROGRESS);
        }
        try {
            userAchievementRepository.saveAndFlush(userAchievement);
        } catch (DataIntegrityViolationException ex) {
            return null;
        }
        return null;
    }

    private int progressFor(
            Achievement achievement,
            int completedSessions,
            int focusMinutes,
            int streakDays,
            SessionAchievementMetrics metrics
    ) {
        switch (achievement.getCode()) {
            case "FOCUS_START_SERIOUS" -> { return completedSessions; }
            case "FOCUS_RHYTHM_KEEPER", "FOCUS_MASTER", "FOCUS_STEEL_DISCIPLINE", "FOCUS_LEGEND" -> { return focusMinutes; }
            case "STREAK_1_DAY", "STREAK_3_DAYS", "STREAK_7_DAYS", "STREAK_21_DAYS", "STREAK_30_DAYS", "STREAK_100_DAYS" -> { return streakDays; }
            case "PERFECT_SESSION_1", "PERFECT_SESSION_5", "PERFECT_SESSION_20", "PERFECT_SESSION_50", "PERFECT_SESSION_100" -> { return metrics.perfectSessions(); }
            case "BREAK_FUND_KEEP_REWARD" -> { return metrics.breakFundPositiveSessions(); }
            case "BREAK_FUND_80_5" -> { return metrics.breakFundAtLeast80Sessions(); }
            case "BREAK_FUND_100_10" -> { return metrics.breakFund100Sessions(); }
            case "BREAK_FUND_AVG_90_30" -> { return metrics.breakFundAverage90Progress(); }
            case "PHONE_DOWN_1", "PHONE_FREE_20", "PHONE_FREE_50" -> { return metrics.phoneFreeSessions(); }
            case "PHONE_STREAK_5" -> { return metrics.phoneFreeConsecutiveSessions(); }
            case "ENTERTAINMENT_BACK_ON_TRACK" -> { return metrics.entertainmentRecoveryEvents(); }
            case "ENTERTAINMENT_CLEAN_5", "ENTERTAINMENT_CLEAN_20", "ENTERTAINMENT_CLEAN_50" -> { return metrics.entertainmentCleanSessions(); }
            case "RECOVERY_BACK_ON_TRACK", "RECOVERY_5", "RECOVERY_20", "RECOVERY_50" -> { return metrics.recoveryEvents(); }
            case "MILESTONE_EARLY_MORNING" -> { return metrics.earlyMorningSessions(); }
            case "MILESTONE_90_MIN_SESSION" -> { return metrics.long90MinuteSessions(); }
            case "MILESTONE_RETURN_AFTER_7_DAYS" -> { return metrics.returnAfterSevenDaysEvents(); }
            case "MILESTONE_WEEKLY_GOAL" -> { return 0; }
            case "MILESTONE_ALL_PERSONALITIES" -> { return metrics.usedAllPersonalities() ? 1 : 0; }
            case "MILESTONE_LAST_BREAK_MINUTE" -> { return metrics.lastBreakMinuteSessions(); }
        }
        return switch (achievement.getCategory()) {
            case SESSION -> completedSessions;
            case FOCUS_TIME -> focusMinutes;
            case STREAK -> streakDays;
            case MILESTONE, BEHAVIORAL -> 0;
        };
    }

    private SessionAchievementMetrics loadSessionMetrics(User user, int completedSessions) {
        ZoneId zone = resolveUserZone(user);
        List<FocusSession> sessions = focusSessionRepository
                .findByUserIdAndStartedAtGreaterThanEqualAndStartedAtLessThanOrderByStartedAtAsc(
                        user.getId(),
                        LocalDate.of(1970, 1, 1).atStartOfDay(zone).toInstant(),
                        LocalDate.now(zone).plusDays(1).atStartOfDay(zone).toInstant()
                )
                .stream()
                .filter(session -> session.getStatus() == SessionStatus.COMPLETED)
                .sorted(Comparator.comparing(FocusSession::getStartedAt))
                .toList();

        int perfect = 0;
        int breakFundPositive = 0;
        int breakFundAtLeast80 = 0;
        int breakFund100 = 0;
        int phoneFree = 0;
        int phoneFreeStreak = 0;
        int currentPhoneFreeStreak = 0;
        int entertainmentClean = 0;
        int entertainmentRecovery = 0;
        int recoveryEvents = 0;
        int earlyMorning = 0;
        int long90 = 0;
        int returnAfterSevenDays = 0;
        int lastBreakMinute = 0;
        Set<String> personalityCodes = new HashSet<>();
        List<Double> breakFundRatios = new ArrayList<>();
        FocusSession previousCompletedSession = null;

        for (FocusSession session : sessions) {
            int focusMinutes = focusMinutes(session);
            if (focusMinutes < 5) {
                continue;
            }
            int hour = session.getStartedAt().atZone(zone).getHour();
            Set<ViolationType> violationTypes = violationTypes(session);
            boolean phoneFreeSession = !violationTypes.contains(ViolationType.PHONE);
            boolean entertainmentCleanSession = !violationTypes.contains(ViolationType.ENTERTAINMENT);
            boolean positionCleanSession = !violationTypes.contains(ViolationType.AWAY)
                    && !violationTypes.contains(ViolationType.LOOK_AWAY);
            boolean completedPlannedDuration = session.getPlannedDuration() == null
                    || safeInt(session.getActiveSeconds()) >= session.getPlannedDuration() * 60;

            if (completedPlannedDuration && phoneFreeSession && entertainmentCleanSession && positionCleanSession) {
                perfect++;
            }

            if (safeInt(session.getPotentialReward()) > 0) {
                breakFundPositive++;
            }
            if (safeInt(session.getTotalRewardPool()) > 0) {
                double breakRatio = safeInt(session.getPotentialReward()) * 1.0 / session.getTotalRewardPool();
                breakFundRatios.add(breakRatio);
                if (breakRatio >= 0.8) {
                    breakFundAtLeast80++;
                }
                if (breakRatio >= 1.0) {
                    breakFund100++;
                }
                if (safeInt(session.getPotentialReward()) == 1) {
                    lastBreakMinute++;
                }
            }

            if (phoneFreeSession) {
                phoneFree++;
                currentPhoneFreeStreak++;
                phoneFreeStreak = Math.max(phoneFreeStreak, currentPhoneFreeStreak);
            } else {
                currentPhoneFreeStreak = 0;
            }

            if (entertainmentCleanSession) {
                entertainmentClean++;
            }

            int sessionRecoveryEvents = recoveryEvents(session);
            recoveryEvents += sessionRecoveryEvents;
            if (violationTypes.contains(ViolationType.ENTERTAINMENT) && sessionRecoveryEvents > 0) {
                entertainmentRecovery++;
            }

            if (hour >= 5 && hour < 8) {
                earlyMorning++;
            }
            if (focusMinutes >= 90) {
                long90++;
            }
            if (previousCompletedSession != null
                    && ChronoUnit.DAYS.between(
                    previousCompletedSession.getStartedAt().atZone(zone).toLocalDate(),
                    session.getStartedAt().atZone(zone).toLocalDate()
            ) >= 7) {
                returnAfterSevenDays++;
            }
            if (session.getPersonality() != null && session.getPersonality().getCode() != null) {
                personalityCodes.add(session.getPersonality().getCode());
            }
            previousCompletedSession = session;
        }

        int breakFundAverage90Progress = breakFundAverage90Progress(breakFundRatios);
        boolean usedAllPersonalities = personalityCodes.containsAll(Set.of("SWEET", "STRICT", "MEAN", "GRUMPY"));

        return new SessionAchievementMetrics(
                perfect,
                breakFundPositive,
                breakFundAtLeast80,
                breakFund100,
                breakFundAverage90Progress,
                phoneFree,
                phoneFreeStreak,
                entertainmentClean,
                entertainmentRecovery,
                recoveryEvents,
                earlyMorning,
                long90,
                returnAfterSevenDays,
                usedAllPersonalities,
                lastBreakMinute
        );
    }

    private record SessionAchievementMetrics(
            int perfectSessions,
            int breakFundPositiveSessions,
            int breakFundAtLeast80Sessions,
            int breakFund100Sessions,
            int breakFundAverage90Progress,
            int phoneFreeSessions,
            int phoneFreeConsecutiveSessions,
            int entertainmentCleanSessions,
            int entertainmentRecoveryEvents,
            int recoveryEvents,
            int earlyMorningSessions,
            int long90MinuteSessions,
            int returnAfterSevenDaysEvents,
            boolean usedAllPersonalities,
            int lastBreakMinuteSessions
    ) {
    }

    private Set<ViolationType> violationTypes(FocusSession session) {
        if (session.getViolations() == null || session.getViolations().isEmpty()) {
            return Set.of();
        }
        Set<ViolationType> types = new HashSet<>();
        session.getViolations().forEach(violation -> types.add(violation.getType()));
        return types;
    }

    private int recoveryEvents(FocusSession session) {
        if (session.getViolations() == null || session.getViolations().isEmpty() || session.getEndedAt() == null) {
            return 0;
        }
        int recoveries = 0;
        for (var violation : session.getViolations()) {
            if (violation.getOccurredAt() == null) {
                continue;
            }
            if (DurationBetweenSeconds(violation.getOccurredAt(), session.getEndedAt()) >= 120) {
                recoveries++;
            }
        }
        return recoveries;
    }

    private long DurationBetweenSeconds(Instant from, Instant to) {
        return Math.max(0, ChronoUnit.SECONDS.between(from, to));
    }

    private int breakFundAverage90Progress(List<Double> breakFundRatios) {
        if (breakFundRatios.isEmpty()) {
            return 0;
        }
        int consideredSessions = Math.min(breakFundRatios.size(), 30);
        List<Double> latestRatios = breakFundRatios.subList(breakFundRatios.size() - consideredSessions, breakFundRatios.size());
        double average = latestRatios.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        if (consideredSessions >= 30 && average >= 0.9) {
            return 30;
        }
        return Math.min(consideredSessions, 29);
    }

    private int safeInt(Integer value) {
        return value != null ? value : 0;
    }

    private int focusMinutes(FocusSession session) {
        if (session.getActiveSeconds() != null && session.getActiveSeconds() > 0) {
            return Math.max(0, session.getActiveSeconds() / 60);
        }
        if (session.getActualDuration() != null) {
            return Math.max(0, session.getActualDuration());
        }
        if (session.getStatus() == SessionStatus.COMPLETED && session.getPlannedDuration() != null) {
            return Math.max(0, session.getPlannedDuration());
        }
        return 0;
    }

    private ZoneId resolveUserZone(User user) {
        if (user.getTimeZone() != null && !user.getTimeZone().isBlank()) {
            try {
                return ZoneId.of(user.getTimeZone());
            } catch (Exception ignored) {
                return VN_ZONE;
            }
        }
        return VN_ZONE;
    }

    private AchievementResponse toResponse(Achievement achievement, UserAchievement userAchievement) {
        int progress = userAchievement != null ? userAchievement.getProgress() : 0;
        UserAchievementStatus status = userAchievement != null
                ? userAchievement.getStatus()
                : UserAchievementStatus.LOCKED;
        Instant unlockedAt = userAchievement != null ? userAchievement.getUnlockedAt() : null;

        return new AchievementResponse(
                achievement.getId(),
                achievement.getCode(),
                achievement.getName(),
                achievement.getDescription(),
                achievement.getIcon(),
                achievement.getCategory(),
                achievement.getRarity(),
                achievement.getTargetValue(),
                achievement.getRewardPoints(),
                progress,
                status,
                unlockedAt
        );
    }

    private void seed(
            String code,
            String name,
            String description,
            String icon,
            AchievementCategory category,
            AchievementRarity rarity,
            int targetValue,
            int rewardPoints
    ) {
        seed(code, name, description, icon, category, rarity, targetValue, rewardPoints, true);
    }

    private void seed(
            String code,
            String name,
            String description,
            String icon,
            AchievementCategory category,
            AchievementRarity rarity,
            int targetValue,
            int rewardPoints,
            boolean active
    ) {
        achievementRepository.findByCode(code)
                .map(achievement -> {
                    achievement.setName(name);
                    achievement.setDescription(description);
                    achievement.setIcon(icon);
                    achievement.setCategory(category);
                    achievement.setRarity(rarity);
                    achievement.setTargetValue(targetValue);
                    achievement.setRewardPoints(rewardPoints);
                    achievement.setActive(active);
                    return achievementRepository.save(achievement);
                })
                .orElseGet(() -> achievementRepository.save(Achievement.builder()
                        .code(code)
                        .name(name)
                        .description(description)
                        .icon(icon)
                        .category(category)
                        .rarity(rarity)
                        .targetValue(targetValue)
                        .rewardPoints(rewardPoints)
                        .active(active)
                        .build()));
    }
}
