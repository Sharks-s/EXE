package com.exe101.exe.service;

import com.exe101.exe.dto.request.ClassifyAppRequest;
import com.exe101.exe.dto.request.CloseSnapshotRequest;
import com.exe101.exe.dto.request.CreateSessionRequest;
import com.exe101.exe.dto.request.ViolationRequest;
import com.exe101.exe.dto.response.*;
import com.exe101.exe.model.enums.SessionStatus;
import com.exe101.exe.model.enums.ViolationType;

public interface FocusSessionService {
    FocusSessionResponse createSession(CreateSessionRequest request, Long userId);

    FocusSessionResponse completeCycle(Long sessionId, Long userId);

    SessionCompleteResponse completeSession(Long sessionId, Long userId);

    FocusSessionResponse cancelSession(Long sessionId, Long userId);

    FocusSessionResponse endSession(Long sessionId, Long userId, boolean isAborted);

    HandleViolationResponse handleViolation(Long sessionId, Long userId, ViolationRequest request);

    FocusSessionResponse pauseSession(Long sessionId, Long userId);

    FocusSessionResponse resumeSession(Long sessionId, Long userId, int minutesUsedByFrontEnd);

    BreakPromptAiResponse getBreakPrompt(Long sessionId, Long userId);

    FocusSessionResponse getActiveSessionByUserId(Long userId);

    PagedResponse<FocusSessionResponse> getSessionHistory(Long userId, SessionStatus status, int page, int size);

    HeartbeatResponse recordHeartbeat(Long sessionId, int actualElapsedSeconds);

    void saveCloseSnapshot(Long sessionId, Long userId, CloseSnapshotRequest request);

    ClassifyAndHandleViolationResponse classifyAndHandleViolation(Long sessionId, Long userId, ClassifyAppRequest request);
}
