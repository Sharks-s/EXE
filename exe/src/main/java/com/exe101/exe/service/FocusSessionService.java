package com.exe101.exe.service;

import com.exe101.exe.dto.request.CreateSessionRequest;
import com.exe101.exe.dto.request.ViolationRequest;
import com.exe101.exe.dto.response.FocusSessionResponse;
import com.exe101.exe.model.enums.ViolationType;

public interface FocusSessionService {
    FocusSessionResponse createSession(CreateSessionRequest request, Long userId);

    FocusSessionResponse completeCycle(Long sessionId, Long userId);

    FocusSessionResponse endSession(Long sessionId, Long userId, boolean isAborted);

    FocusSessionResponse handleViolation(Long sessionId, Long userId, ViolationRequest request);

}
