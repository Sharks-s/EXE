package com.exe101.exe.service.impl;

import com.exe101.exe.config.AppSeedProperties;
import com.exe101.exe.dto.request.CreateSessionRequest;
import com.exe101.exe.dto.request.ViolationRequest;
import com.exe101.exe.dto.response.FocusSessionResponse;
import com.exe101.exe.dto.response.HandleViolationResponse;
import com.exe101.exe.model.entity.*;
import com.exe101.exe.model.enums.ViolationType;
import com.exe101.exe.repository.SubscriptionRepository;
import com.exe101.exe.repository.UserPetRepository;
import com.exe101.exe.service.FocusSessionService;
import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.mapper.FocusSessionMapper;
import com.exe101.exe.model.enums.SessionStatus;
import com.exe101.exe.repository.FocusSessionRepository;
import com.exe101.exe.repository.PersonalityRepository;
import com.exe101.exe.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FocusSessionServiceImpl implements FocusSessionService {

    private final FocusSessionRepository focusSessionRepository;
    private final PersonalityRepository personalityRepository;
    private final FocusSessionMapper focusSessionMapper;
    private final UserService userService;
    private final UserPetRepository userPetRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final AppSeedProperties appSeedProperties;

    private static final Set<ViolationType> NON_PENALTY_TYPES = Set.of(
            ViolationType.BAD_POSTURE,
            ViolationType.POOR_LIGHTING
    );

    @Override
    @Transactional
    public FocusSessionResponse createSession(CreateSessionRequest request, Long userId) {

        Instant now = Instant.now();
        ZoneId vnZone = ZoneId.of("Asia/Ho_Chi_Minh");
        LocalDate today = now.atZone(vnZone).toLocalDate();

        // 1. Xử lý và dọn dẹp các phiên IN_PROGRESS cũ bị kẹt
        List<FocusSession> activeSessions = focusSessionRepository
                .findByUserIdAndStatus(userId, SessionStatus.IN_PROGRESS);

        if (!activeSessions.isEmpty()) {
            boolean hasRealActiveSession = activeSessions.stream()
                    .anyMatch(s -> now.isBefore(
                            s.getStartedAt().plus(s.getPlannedDuration(), ChronoUnit.MINUTES)
                    ));

            if (hasRealActiveSession) {
                throw new BusinessException(ErrorCode.SESSION_ALREADY_RUNNING);
            }

            activeSessions.forEach(s -> {
                s.setStatus(SessionStatus.CANCELLED);
                s.setEndedAt(s.getStartedAt().plus(s.getPlannedDuration(), ChronoUnit.MINUTES));
            });
            focusSessionRepository.saveAll(activeSessions);
        }

        // 2. Kiểm tra và cập nhật hạn mức ngày (Daily Limit)
        User user = userService.findById(userId);

        LocalDate lastUsageLocalDate = user.getLastUsageDate() != null
                ? user.getLastUsageDate().atZone(vnZone).toLocalDate()
                : null;

        if (lastUsageLocalDate == null || !lastUsageLocalDate.isEqual(today)) {
            user.setDailyUsedMinutes(0);
            user.setLastUsageDate(now);
            userService.save(user);
        }

        // 3. Chặn nếu vượt hạn mức 120 phút (Chỉ áp dụng với Free User)
        boolean isPremium = subscriptionRepository.existsByUserIdAndIsActiveTrue(userId);

        if (!isPremium) {
            int projectedUsage = user.getDailyUsedMinutes() + request.durationMinutes();
            if (projectedUsage > appSeedProperties.getDailyFreeUsage()) {
                throw new BusinessException(ErrorCode.DAILY_LIMIT_EXCEEDED);
            }
        }

        // 4. Lấy Pet đang equipped (Fallback về default pet)
        UserPet activePet = userPetRepository.findByUserIdAndEquippedTrue(userId)
                .orElseGet(() -> userPetRepository.findDefaultPetByUserId(userId)
                        .orElseThrow(() -> new BusinessException(ErrorCode.DEFAULT_PET_NOT_FOUND)));

        // 5. Lấy cá tính cấu hình sẵn của User, nếu không có thì dùng cá tính mặc định "SWEET"
        Personality chosenPersonality = user.getPersonality();
        if (chosenPersonality == null) {
            chosenPersonality = personalityRepository.findByCode(appSeedProperties.getDefaultPersonalityCode())
                    .orElseThrow(() -> new BusinessException(ErrorCode.PERSONALITY_NOT_FOUND));
        }

        // 6. Tính toán quỹ thưởng giải lao (Cứ 25 phút học -> 5 phút nghỉ)
        int breakBankMinutes = (request.durationMinutes() / 25) * 5;

        // 7. Tạo và lưu phiên học mới
        FocusSession session = FocusSession.builder()
                .user(user)
                .personality(chosenPersonality)
                .userPet(activePet)
                .goal(request.goal())
                .plannedDuration(request.durationMinutes())
                .totalRewardPool(breakBankMinutes)
                .potentialReward(breakBankMinutes)
                .accumulatedReward(0)
                .status(SessionStatus.IN_PROGRESS)
                .startedAt(now)
                .lastCycleAt(now)
                .build();

        FocusSession savedSession = focusSessionRepository.save(session);
        return focusSessionMapper.toResponse(savedSession);
    }

    @Override
    @Transactional
    public FocusSessionResponse completeCycle(Long sessionId, Long userId) {
        Instant now = Instant.now();

        FocusSession session = focusSessionRepository.findById(sessionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SESSION_NOT_FOUND));

        if (!session.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.SESSION_UNAUTHORIZED_ACCESS);
        }

        if (session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new BusinessException(ErrorCode.SESSION_NOT_IN_PROGRESS);
        }

        // Xác định mốc gốc để tính toán (Hiệp trước đó hoặc lúc vừa start phiên)
        Instant baseTime = session.getLastCycleAt() != null ? session.getLastCycleAt() : session.getStartedAt();

        // Chặn chống spam API (Phải học ít nhất 24 phút kể từ mốc gốc)
        Instant minimumCallTime = baseTime.plus(24, ChronoUnit.MINUTES);
        if (now.isBefore(minimumCallTime)) {
            throw new BusinessException(ErrorCode.SESSION_CYCLE_NOT_COMPLETED_YET);
        }

        // TỐI ƯU: Neo cứng mốc cycle đúng bằng thời gian chuẩn của hiệp (baseTime + 25p)
        // Cách này giúp triệt tiêu hoàn toàn sai số do lag mạng hoặc delay bấm nút của user
        session.setLastCycleAt(baseTime.plus(25, ChronoUnit.MINUTES));

        // Dịch chuyển dòng tiền thưởng giải lao
        int amountToMove = Math.min(appSeedProperties.getDefaultViolationMinutes(), session.getPotentialReward());
        session.setPotentialReward(session.getPotentialReward() - amountToMove);
        session.setAccumulatedReward(session.getAccumulatedReward() + amountToMove);

        // Cộng dồn hạn mức ngày cho User
        User user = userService.findById(userId);
        user.setDailyUsedMinutes(user.getDailyUsedMinutes() + 25);
        userService.save(user);

        FocusSession savedSession = focusSessionRepository.save(session);
        return focusSessionMapper.toResponse(savedSession);
    }

    @Override
    @Transactional
    public FocusSessionResponse endSession(Long sessionId, Long userId, boolean isAborted) {
        Instant now = Instant.now();

        FocusSession session = focusSessionRepository.findById(sessionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SESSION_NOT_FOUND));

        if (!session.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.SESSION_UNAUTHORIZED_ACCESS);
        }

        if (session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new BusinessException(ErrorCode.SESSION_NOT_IN_PROGRESS);
        }

        int totalElapsedMinutes = (int) Duration.between(session.getStartedAt(), now).toMinutes();
        int actualMinutes = isAborted
                ? Math.min(totalElapsedMinutes, session.getPlannedDuration())
                : session.getPlannedDuration();

        session.setActualDuration(actualMinutes);
        session.setEndedAt(now);

        if (isAborted) {
            session.setStatus(SessionStatus.ABORTED);
            session.setAccumulatedReward(session.getAccumulatedReward() / 2);
        } else {
            session.setStatus(SessionStatus.COMPLETED);
        }

        if (session.getAccumulatedReward() > 0 && session.getUserPet() != null) {
            UserPet pet = session.getUserPet();
            pet.setExperience(pet.getExperience() + session.getAccumulatedReward() * 60);
            userPetRepository.save(pet);
        }

        FocusSession savedSession = focusSessionRepository.save(session);
        return focusSessionMapper.toResponse(savedSession);
    }


    @Override
    @Transactional
    public HandleViolationResponse handleViolation(Long sessionId, Long userId, ViolationRequest request) {
        FocusSession session = focusSessionRepository.findById(sessionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SESSION_NOT_FOUND));

        if (!session.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.SESSION_UNAUTHORIZED_ACCESS);
        }

        if (session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new BusinessException(ErrorCode.SESSION_NOT_IN_PROGRESS);
        }

        boolean isPenalty = !NON_PENALTY_TYPES.contains(request.type());
        int penaltyMinutes = isPenalty ? 1 : 0;

        if (isPenalty) {
            if (session.getPotentialReward() >= penaltyMinutes) {
                session.setPotentialReward(session.getPotentialReward() - penaltyMinutes);
            } else {
                int remainingPenalty = penaltyMinutes - session.getPotentialReward();
                session.setPotentialReward(0);
                session.setAccumulatedReward(Math.max(0, session.getAccumulatedReward() - remainingPenalty));
            }
        }
        // Nhóm nhắc nhở (BAD_POSTURE, POOR_LIGHTING) -> không đụng vào potentialReward/accumulatedReward,
        // chỉ ghi lại Violation để có log/thống kê, không phải lỗi nên không throw.

        Violation violation = Violation.builder()
                .session(session)
                .type(request.type())
                .minutesDeducted(penaltyMinutes) // 0 cho nhóm nhắc nhở
                .appName(request.appName())
                .windowTitle(request.windowTitle())
                .build();
        session.addViolation(violation);

        FocusSession savedSession = focusSessionRepository.save(session);

        return HandleViolationResponse.builder()
                .focusSessionResponse(focusSessionMapper.toResponse(savedSession))
                .isPenalty(isPenalty)
                .type(request.type())
                .build();
    }

    @Override
    @Transactional
    public FocusSessionResponse pauseSession(Long sessionId, Long userId) {
        FocusSession session = loadOwnedSession(sessionId, userId);

        if (session.getPausedAt() != null) {
            throw new BusinessException(ErrorCode.SESSION_ALREADY_PAUSED);
        }

        // 🎯 CHECK THỜI GIAN NGHỈ THƯỞNG: Nếu không còn phút nghỉ nào thì KHÔNG cho pause
        if (session.getAccumulatedReward() <= 0) {
            throw new BusinessException(ErrorCode.NO_BREAK_TIME_AVAILABLE);
        }

        // Tiến hành đóng băng để bắt đầu tính giờ nghỉ
        session.setPausedAt(Instant.now());
        FocusSession savedSession = focusSessionRepository.save(session);

        return focusSessionMapper.toResponse(savedSession);
    }

    @Override
    @Transactional
    public FocusSessionResponse resumeSession(Long sessionId, Long userId, int minutesUsedByFrontEnd) {
        FocusSession session = loadOwnedSession(sessionId, userId);

        if (session.getPausedAt() == null) {
            throw new BusinessException(ErrorCode.SESSION_NOT_PAUSED);
        }

        //Không tính Duration.between nữa, tin tưởng hoàn toàn vào số phút FE gửi lên
        // Bọc thêm Math.min để chống trường hợp FE gửi bậy số phút lớn hơn ví hiện có
        int minutesConsumed = Math.min(minutesUsedByFrontEnd, session.getAccumulatedReward());

        // Khấu trừ vào ví nghỉ thưởng
        session.setAccumulatedReward(session.getAccumulatedReward() - minutesConsumed);

        // Cộng dồn vào thời gian pause tổng để loại trừ khỏi thời gian học thực tế
        session.setPausedMinutes(session.getPausedMinutes() + minutesConsumed);

        // Giải phóng trạng thái nghỉ
        session.setPausedAt(null);

        FocusSession savedSession = focusSessionRepository.save(session);
        return focusSessionMapper.toResponse(savedSession);
    }
    // Helper

    private FocusSession loadOwnedSession(Long sessionId, Long userId) {
        FocusSession session = focusSessionRepository.findById(sessionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SESSION_NOT_FOUND));

        if (!session.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.SESSION_UNAUTHORIZED_ACCESS);
        }
        if (session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new BusinessException(ErrorCode.SESSION_NOT_IN_PROGRESS);
        }
        return session;
    }

    private Instant effectiveNow(FocusSession session) {
        // Nếu đang trong trạng thái nghỉ/chờ, mốc thời gian hiệu lực sẽ bị đóng băng tại pausedAt
        return session.getPausedAt() != null ? session.getPausedAt() : Instant.now();
    }

    private int getActualFocusMinutes(FocusSession session) {
        Instant now = effectiveNow(session);
        long totalElapsedMins = Duration.between(session.getStartedAt(), now).toMinutes();
        // Tổng thời gian học thực tế = Toàn bộ thời gian từ lúc start - Thời gian đã pause/break
        return (int) totalElapsedMins - session.getPausedMinutes();
    }
}
