package com.exe101.exe.service.impl;

import com.exe101.exe.config.AppSeedProperties;
import com.exe101.exe.dto.request.ClassifyAppRequest;
import com.exe101.exe.dto.request.CloseSnapshotRequest;
import com.exe101.exe.dto.request.CreateSessionRequest;
import com.exe101.exe.dto.request.ViolationRequest;
import com.exe101.exe.dto.response.*;
import com.exe101.exe.model.entity.*;
import com.exe101.exe.model.enums.ViolationType;
import com.exe101.exe.repository.SubscriptionRepository;
import com.exe101.exe.repository.UserPetRepository;
import com.exe101.exe.service.*;
import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.mapper.FocusSessionMapper;
import com.exe101.exe.model.enums.SessionStatus;
import com.exe101.exe.repository.FocusSessionRepository;
import com.exe101.exe.repository.PersonalityRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
    private final AiCloudService aiCloudService;
    private final PersonalityService personalityService;
    private final PromptTemplateService promptTemplateService;
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");


    private static final Set<ViolationType> NON_PENALTY_TYPES = Set.of(
            ViolationType.BAD_POSTURE,
            ViolationType.POOR_LIGHTING,
            ViolationType.TOO_CLOSE
    );
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public FocusSessionResponse createSession(CreateSessionRequest request, Long userId) {

        Instant now = Instant.now();
        // 1. Xử lý và dọn dẹp các phiên IN_PROGRESS cũ bị kẹt
        List<FocusSession> activeSessions = focusSessionRepository
                .findByUserIdAndStatus(userId, SessionStatus.IN_PROGRESS);

        if (!activeSessions.isEmpty()) {
            throw new BusinessException(ErrorCode.SESSION_ALREADY_RUNNING);
        }

        // 2. Kiểm tra và cập nhật hạn mức ngày (Daily Limit)
        User user = userService.findById(userId);

        resetDailyUsageIfNeeded(user, now);

        // 3. Chặn nếu vượt hạn mức 120 phút (Chỉ áp dụng với Free User)
        boolean isPremium = subscriptionRepository.existsByUserIdAndIsActiveTrue(userId);

        if (!isPremium) {
            if (exceedsDailyUsageLimit(user, request.durationMinutes())) {
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

        // Dùng findByIdForUpdate để khóa dòng, tránh 2 request (violation + cycle) đụng độ ghi đè nhau
        FocusSession session = focusSessionRepository.findByIdForUpdate(sessionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SESSION_NOT_FOUND));

        if (!session.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.SESSION_UNAUTHORIZED_ACCESS);
        }

        if (session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new BusinessException(ErrorCode.SESSION_NOT_IN_PROGRESS);
        }

        // Xác định mốc gốc để tính toán (Phiên trước đó hoặc lúc vừa start phiên)
        Instant baseTime = session.getLastCycleAt() != null ? session.getLastCycleAt() : session.getStartedAt();

        // Chặn chống spam API bằng cách kiểm tra thời gian hiện tại đã đủ 25 phút kể từ mốc baseTime chưa
        Instant expectedCycleEnd = baseTime.plus(25, ChronoUnit.MINUTES);
        // Cho phép lệch tối đa 30 giây
        if (now.plusSeconds(30).isBefore(expectedCycleEnd)) {
            throw new BusinessException(ErrorCode.SESSION_CYCLE_NOT_COMPLETED_YET);
        }

        // TỐI ƯU: Neo cứng mốc cycle đúng bằng thời gian chuẩn của Phiên (baseTime + 25p)
        // Cách này giúp triệt tiêu hoàn toàn sai số do lag mạng hoặc delay bấm nút của user
        session.setLastCycleAt(baseTime.plus(25, ChronoUnit.MINUTES));

        // Dịch chuyển dòng tiền thưởng giải lao
        int amountToMove = Math.min(appSeedProperties.getDefaultCycleMinutes(), session.getPotentialReward());
        session.setPotentialReward(session.getPotentialReward() - amountToMove);
        session.setAccumulatedReward(session.getAccumulatedReward() + amountToMove);

//        // Cộng dồn hạn mức ngày cho User
//        User user = userService.findById(userId);
//        user.setDailyUsedMinutes(user.getDailyUsedMinutes() + 25);
//        userService.save(user);

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

        int actualMinutes = isAborted
                ? Math.min(getActualFocusMinutes(session), session.getPlannedDuration())
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
        // Dùng findByIdForUpdate để khóa dòng, tránh 2 vi phạm gần như đồng thời đọc trùng giá trị cũ rồi ghi đè nhau
        FocusSession session = focusSessionRepository.findByIdForUpdate(sessionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SESSION_NOT_FOUND));

        if (!session.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.SESSION_UNAUTHORIZED_ACCESS);
        }

        if (session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new BusinessException(ErrorCode.SESSION_NOT_IN_PROGRESS);
        }

        boolean isPenalty = !NON_PENALTY_TYPES.contains(request.type());
        int penaltyMinutes = isPenalty ? 1 : 0;

        FocusSession savedSession = applyPenaltyAndRecordViolation(
                session, request.type(), request.appName(), request.windowTitle(), penaltyMinutes);

        int violationCount = savedSession.getViolations() != null ? savedSession.getViolations().size() : 0;

        String pCode = session.getPersonality() != null ? session.getPersonality().getCode() : "SWEET";
        String pName = session.getUserPet() != null ? session.getUserPet().getCustomName() : "Khỉ";
        String pPet = session.getUserPet() != null ? session.getUserPet().getPet().getName() : "Khỉ";
        String language = "vi"; //tạm

        String personalityInstruction = personalityService.getPersonalityDescriptionByCode(pCode);
        String[] addressPair = getAddressPair(session.getUser());

        boolean isCameraSource = "Camera Tracker".equals(request.appName());
        String taskPromptKey = isCameraSource ? "CAMERA_VIOLATION_SPEECH" : "APP_VIOLATION_SPEECH";

        Map<String, String> promptValues = new HashMap<>();
        promptValues.put("petName", pName);
        promptValues.put("petSpecies", pPet);
        promptValues.put("personalityCode", pCode);
        promptValues.put("personalityDescription", personalityInstruction);
        promptValues.put("selfAddress", addressPair[0]);
        promptValues.put("userAddress", addressPair[1]);
        promptValues.put("language", language);
        promptValues.put("violationType", request.type().name());
        promptValues.put("appName", request.appName());
        promptValues.put("windowTitle", request.windowTitle());

        String systemPrompt = promptTemplateService.renderWithPersona(taskPromptKey, promptValues);

        String userPrompt = "Hãy nói một câu với tôi đi!";
        String rawResponse = aiCloudService.requestAiSpeech(systemPrompt, userPrompt);

        String aiSpeech = null;
        String aiAction = null;

        if (rawResponse != null && !rawResponse.isEmpty()) {
            try {
                String cleanJson = rawResponse.replaceAll("```json|```", "").trim();
                Map<String, String> parsed = objectMapper.readValue(cleanJson, Map.class);
                aiSpeech = parsed.get("speech");
                aiAction = parsed.get("action");
            } catch (Exception e) {
                System.err.println("[FocusSessionService] Lỗi parse JSON câu thoại vi phạm: " + e.getMessage());
            }
        }

        // Fallback an toàn nếu AI bị nghẽn mạch hoặc parse lỗi
        if (aiSpeech == null || aiSpeech.isEmpty()) {
            aiSpeech = isPenalty ? "Tập trung lại nào, đừng để tôi phải nhắc nhé!" : "Chú ý tư thế và ánh sáng kìa bạn ơi!";
        }
        if (aiAction == null || aiAction.isEmpty()) {
            aiAction = isPenalty ? "angry" : "remind";
        }

        return HandleViolationResponse.builder()
                .focusSessionResponse(focusSessionMapper.toResponse(savedSession))
                .isPenalty(isPenalty)
                .type(request.type())
                .aiSpeech(aiSpeech)
                .aiAction(aiAction)
                .violationCount(violationCount)
                .build();
    }

    @Override
    @Transactional
    public FocusSessionResponse pauseSession(Long sessionId, Long userId) {
        FocusSession session = loadOwnedSession(sessionId, userId);

        if (session.getPausedAt() != null) {
            throw new BusinessException(ErrorCode.SESSION_ALREADY_PAUSED);
        }

        // CHECK THỜI GIAN NGHỈ THƯỞNG: Nếu không còn phút nghỉ nào thì KHÔNG cho pause
        if (session.getAccumulatedReward() <= 0) {
            throw new BusinessException(ErrorCode.NO_BREAK_TIME_AVAILABLE);
        }

        // Tiến hành đóng băng để bắt đầu tính giờ nghỉ
        session.setPausedAt(Instant.now());

        // Đếm số lần nghỉ đã bắt đầu trong session
        session.setBreakCount(session.getBreakCount() + 1);

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
        int minutesConsumed = Math.max(
                0,
                Math.min(minutesUsedByFrontEnd, session.getAccumulatedReward())
        );

        // Khấu trừ vào ví nghỉ thưởng
        session.setAccumulatedReward(session.getAccumulatedReward() - minutesConsumed);

        // Cộng dồn vào thời gian pause tổng để loại trừ khỏi thời gian học thực tế
        session.setPausedMinutes(session.getPausedMinutes() + minutesConsumed);

        // Giải phóng trạng thái nghỉ
        session.setPausedAt(null);

        FocusSession savedSession = focusSessionRepository.save(session);
        return focusSessionMapper.toResponse(savedSession);
    }

    @Override
    public BreakPromptAiResponse getBreakPrompt(Long sessionId, Long userId) {
        FocusSession session = focusSessionRepository.findById(sessionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SESSION_NOT_FOUND));

        if (!session.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.SESSION_UNAUTHORIZED_ACCESS);
        }

        String pCode = session.getPersonality() != null ? session.getPersonality().getCode() : "SWEET";
        String pName = session.getUserPet() != null ? session.getUserPet().getCustomName() : "Khỉ";
        String pPet = session.getUserPet() != null ? session.getUserPet().getPet().getName() : "Khỉ";
        String language = "vi"; //tạm

        String personalityInstruction = personalityService.getPersonalityDescriptionByCode(pCode);
        String[] addressPair = getAddressPair(session.getUser());

        Map<String, String> promptValues = new HashMap<>();
        promptValues.put("petName", pName);
        promptValues.put("petSpecies", pPet);
        promptValues.put("personalityCode", pCode);
        promptValues.put("personalityDescription", personalityInstruction);
        promptValues.put("selfAddress", addressPair[0]);
        promptValues.put("userAddress", addressPair[1]);
        promptValues.put("language", language);

        String systemPrompt = promptTemplateService.renderWithPersona("BREAK_PROMPT_SPEECH", promptValues);

        String userPrompt = "Hãy gợi ý lời thoại nghỉ ngơi cho tôi dưới dạng JSON.";

        try {
            String rawJsonFromAi = aiCloudService.requestAiSpeech(systemPrompt, userPrompt);
            if (rawJsonFromAi != null && !rawJsonFromAi.isEmpty()) {
                // Làm sạch chuỗi nếu AI tự ý bọc khối code markdown
                String cleanJson = rawJsonFromAi.replaceAll("```json|```", "").trim();
                return objectMapper.readValue(cleanJson, BreakPromptAiResponse.class);
            }
        } catch (Exception e) {
            System.err.println("[FocusSessionService] Lỗi parse JSON thoại nghỉ ngơi từ AI, dùng fallback: " + e.getMessage());
        }

        // Fallback an toàn nếu AI Cloud có sự cố
        return BreakPromptAiResponse.builder()
                .aiSpeech("Hết phiên 25 phút rồi! Bạn muốn nghỉ ngơi một chút chứ?")
                .actions(List.of(
                        new AiBubbleAction("Nghỉ ngơi ☕", "primary"),
                        new AiBubbleAction("Cày tiếp 🎯", "secondary")
                ))
                .build();
    }

    @Override
    @Transactional
    public FocusSessionResponse getActiveSessionByUserId(Long userId) {
        FocusSession session = focusSessionRepository
                .findFirstByUserIdAndStatusOrderByStartedAtDesc(userId, SessionStatus.IN_PROGRESS)
                .orElse(null);

        if (session == null) {
            return null;
        }

        FocusSessionResponse response = withCloseState(focusSessionMapper.toResponse(session), session);

        // Đã đọc xong, dọn dấu vết để lần gọi sau (nếu app không đóng nữa) không đọc lại giá trị cũ
        if (session.getElapsedSecondsAtClose() != null) {
            session.setElapsedSecondsAtClose(null);
            session.setWasBreakingWhenClosed(null);
            session.setBreakRemainingSecondsAtClose(null);
            focusSessionRepository.save(session);
        }

        return response;
    }

    private FocusSessionResponse withCloseState(FocusSessionResponse response, FocusSession session) {
        Integer elapsed = session.getElapsedSecondsAtClose();
        return new FocusSessionResponse(
                response.id(), response.goal(), response.plannedDuration(), response.actualDuration(),
                response.totalRewardPool(), response.potentialReward(), response.accumulatedReward(),
                response.status(), response.startedAt(), response.endedAt(), response.userPetId(),
                response.personalityId(), response.lastCycleAt(), response.violations(), response.breakCount(),
                response.pausedMinutes(), elapsed != null ? elapsed : 0,
                session.getWasBreakingWhenClosed(),
                session.getBreakRemainingSecondsAtClose()
        );
    }

    @Override
    @Transactional
    public HeartbeatResponse recordHeartbeat(Long sessionId, int actualElapsedSeconds) {
        FocusSession session = focusSessionRepository.findById(sessionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SESSION_NOT_FOUND));
        Instant now = Instant.now();
        User user = session.getUser();
        resetDailyUsageIfNeeded(user, now);

        int lastElapsedSeconds = session.getLastHeartbeatElapsedSeconds() != null
                ? session.getLastHeartbeatElapsedSeconds() : 0;
        int deltaSeconds = Math.max(0, actualElapsedSeconds - lastElapsedSeconds);
        int deltaMinutes = deltaSeconds / 60;

        if (deltaMinutes > 0) {
            if (exceedsDailyUsageLimit(user, deltaMinutes)) {
                throw new BusinessException(ErrorCode.DAILY_LIMIT_EXCEEDED);
            }

            user.setDailyUsedMinutes(currentDailyUsedMinutes(user) + deltaMinutes);
            user.setLastUsageDate(now);
            userService.save(user);
        }

        session.setLastHeartbeatElapsedSeconds(actualElapsedSeconds);
        session.setLastHeartbeatAt(now);
        focusSessionRepository.save(session);

        return new HeartbeatResponse(
                currentDailyUsedMinutes(user),
                appSeedProperties.getDailyFreeUsage()
        );
    }

    @Override
    @Transactional
    public void saveCloseSnapshot(Long sessionId, Long userId, CloseSnapshotRequest request) {
        FocusSession session = focusSessionRepository.findByIdForUpdate(sessionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SESSION_NOT_FOUND));

        if (!session.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.SESSION_UNAUTHORIZED_ACCESS);
        }
        if (session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new BusinessException(ErrorCode.SESSION_NOT_IN_PROGRESS);
        }

        session.setElapsedSecondsAtClose(request.elapsedSeconds());
        session.setWasBreakingWhenClosed(request.wasBreaking());
        session.setBreakRemainingSecondsAtClose(request.breakRemainingSeconds());

        focusSessionRepository.save(session);
    }

    @Override
    @Transactional
    public ClassifyAndHandleViolationResponse classifyAndHandleViolation(
            Long sessionId, Long userId, ClassifyAppRequest request) {

        FocusSession session = focusSessionRepository.findByIdForUpdate(sessionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SESSION_NOT_FOUND));

        if (!session.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.SESSION_UNAUTHORIZED_ACCESS);
        }
        if (session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new BusinessException(ErrorCode.SESSION_NOT_IN_PROGRESS);
        }

        Map<String, String> classifyValues = Map.of(
                "appName", request.appName() != null ? request.appName() : "",
                "windowTitle", request.windowTitle() != null ? request.windowTitle() : ""
        );
        String classifyPrompt = promptTemplateService.render("CLASSIFY_APP_SAFETY", classifyValues);

        String classifyResult = aiCloudService.requestAiSpeech(classifyPrompt, "Phân loại ứng dụng này.");
        boolean isViolation = classifyResult != null && classifyResult.trim().toUpperCase().contains("VIOLATION");

        if (!isViolation) {
            return ClassifyAndHandleViolationResponse.builder()
                    .focusSessionResponse(focusSessionMapper.toResponse(session))
                    .isViolation(false)
                    .violationCount(session.getViolations() != null ? session.getViolations().size() : 0)
                    .build();
        }

        // Nếu vi phạm->trừ điểm + sinh lời thoại luôn trong cùng request
        FocusSession savedSession = applyPenaltyAndRecordViolation(
                session, ViolationType.ENTERTAINMENT, request.appName(), request.windowTitle(), 1);
        int violationCount = savedSession.getViolations() != null ? savedSession.getViolations().size() : 0;

        String pCode = session.getPersonality() != null ? session.getPersonality().getCode() : "SWEET";
        String pName = session.getUserPet() != null ? session.getUserPet().getCustomName() : "Khỉ";
        String pPet = session.getUserPet() != null ? session.getUserPet().getPet().getName() : "Khỉ";
        String personalityInstruction = personalityService.getPersonalityDescriptionByCode(pCode);
        String[] addressPair = getAddressPair(session.getUser());

        Map<String, String> promptValues = new HashMap<>();
        promptValues.put("petName", pName);
        promptValues.put("petSpecies", pPet);
        promptValues.put("personalityCode", pCode);
        promptValues.put("personalityDescription", personalityInstruction);
        promptValues.put("selfAddress", addressPair[0]);
        promptValues.put("userAddress", addressPair[1]);
        promptValues.put("language", "vi");
        promptValues.put("appName", request.appName());

        String speechPrompt = promptTemplateService.renderWithPersona("CLASSIFY_APP_SPEECH", promptValues);
        String rawResponse = aiCloudService.requestAiSpeech(speechPrompt, "Nhắc user quay lại học ngay!");

        String aiSpeech = null;
        String aiAction = null;

        if (rawResponse != null && !rawResponse.isEmpty()) {
            try {
                String cleanJson = rawResponse.replaceAll("```json|```", "").trim();
                Map<String, String> parsed = objectMapper.readValue(cleanJson, Map.class);
                aiSpeech = parsed.get("speech");
                aiAction = parsed.get("action");
            } catch (Exception e) {
                System.err.println("[FocusSessionService] Lỗi parse JSON câu thoại classify: " + e.getMessage());
            }
        }

        if (aiSpeech == null || aiSpeech.isEmpty()) {
            aiSpeech = "Tắt tab đó đi và quay lại học ngay nào!";
        }
        if (aiAction == null || aiAction.isEmpty()) {
            aiAction = "angry";
        }

        return ClassifyAndHandleViolationResponse.builder()
                .focusSessionResponse(focusSessionMapper.toResponse(savedSession))
                .isViolation(true)
                .aiSpeech(aiSpeech)
                .aiAction(aiAction)
                .violationCount(violationCount)
                .build();

    }

    // Helper

    private FocusSession loadOwnedSession(Long sessionId, Long userId) {
        // Dùng findByIdForUpdate để khóa dòng, tránh pause/resume/end đụng độ với violation/cycle
        FocusSession session = focusSessionRepository.findByIdForUpdate(sessionId)
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

    private void resetDailyUsageIfNeeded(User user, Instant now) {
        LocalDate today = now.atZone(VN_ZONE).toLocalDate();
        LocalDate lastUsageLocalDate = user.getLastUsageDate() != null
                ? user.getLastUsageDate().atZone(VN_ZONE).toLocalDate()
                : null;

        if (lastUsageLocalDate == null || !lastUsageLocalDate.isEqual(today)) {
            user.setDailyUsedMinutes(0);
            user.setLastUsageDate(now);
            userService.save(user);
        }
    }

    private boolean exceedsDailyUsageLimit(User user, int minutesToAdd) {
        return currentDailyUsedMinutes(user) + minutesToAdd > appSeedProperties.getDailyFreeUsage();
    }

    private int currentDailyUsedMinutes(User user) {
        return user.getDailyUsedMinutes() != null ? user.getDailyUsedMinutes() : 0;
    }

    // Helper dùng chung cho cả handleViolation và classifyAndHandleViolation
    // Trừ điểm phạt, tạo bản ghi Violation, trả về response đã build sẵn phần session + violationCount
    private FocusSession applyPenaltyAndRecordViolation(
            FocusSession session, ViolationType type, String appName, String windowTitle, int penaltyMinutes) {

        if (penaltyMinutes > 0) {
            if (session.getPotentialReward() >= penaltyMinutes) {
                session.setPotentialReward(session.getPotentialReward() - penaltyMinutes);
            } else {
                int remainingPenalty = penaltyMinutes - session.getPotentialReward();
                session.setPotentialReward(0);
                session.setAccumulatedReward(Math.max(0, session.getAccumulatedReward() - remainingPenalty));
            }
        }

        Violation violation = Violation.builder()
                .session(session)
                .type(type)
                .minutesDeducted(penaltyMinutes)
                .appName(appName)
                .windowTitle(windowTitle)
                .build();
        session.addViolation(violation);

        return focusSessionRepository.save(session);
    }

    private String[] getAddressPair(User user) {
        String selfAddress = (user.getAiSelfAddress() != null && !user.getAiSelfAddress().isBlank())
                ? user.getAiSelfAddress() : "tôi";
        String userAddress = (user.getAiUserAddress() != null && !user.getAiUserAddress().isBlank())
                ? user.getAiUserAddress() : "bạn";
        return new String[]{selfAddress, userAddress};
    }

}