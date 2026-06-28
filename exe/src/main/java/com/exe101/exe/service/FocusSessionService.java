package com.exe101.exe.service;

import com.exe101.exe.dto.request.CreateSessionRequest;
import com.exe101.exe.dto.request.ViolationRequest;
import com.exe101.exe.dto.response.BreakPromptAiResponse;
import com.exe101.exe.dto.response.FocusSessionResponse;
import com.exe101.exe.dto.response.HandleViolationResponse;
import com.exe101.exe.model.enums.ViolationType;

public interface FocusSessionService {
    FocusSessionResponse createSession(CreateSessionRequest request, Long userId);

    FocusSessionResponse completeCycle(Long sessionId, Long userId);

    FocusSessionResponse endSession(Long sessionId, Long userId, boolean isAborted);

    HandleViolationResponse handleViolation(Long sessionId, Long userId, ViolationRequest request);

    FocusSessionResponse pauseSession(Long sessionId, Long userId);

    FocusSessionResponse resumeSession(Long sessionId, Long userId, int minutesUsedByFrontEnd);

    BreakPromptAiResponse getBreakPrompt(Long sessionId, Long userId);

    FocusSessionResponse getActiveSessionByUserId(Long userId);

    void recordHeartbeat(Long sessionId);
}
