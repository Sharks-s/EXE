package com.exe101.exe.controller;

import com.exe101.exe.dto.request.ClassifyAppRequest;
import com.exe101.exe.dto.request.CreateSessionRequest;
import com.exe101.exe.dto.request.ViolationRequest;
import com.exe101.exe.dto.response.*;
import com.exe101.exe.model.enums.ViolationType;
import com.exe101.exe.security.CustomUserDetails;
import com.exe101.exe.service.FocusSessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/focus-sessions")
@RequiredArgsConstructor
public class FocusSessionController {

    private final FocusSessionService focusSessionService;

    @PostMapping("/start")
    public ApiResponse<FocusSessionResponse> createSession(
            @Valid @RequestBody CreateSessionRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        FocusSessionResponse response = focusSessionService.createSession(request, userDetails.getId());
        return ApiResponse.success(response);
    }

    @GetMapping("/active")
    public ApiResponse<FocusSessionResponse> getActiveSession(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        FocusSessionResponse activeSession = focusSessionService.getActiveSessionByUserId(userDetails.getId());
        if (activeSession == null) {
            return ApiResponse.success(null);
        }
        return ApiResponse.success(activeSession);
    }

    @PostMapping("/{id}/heartbeat")
    public ApiResponse<Void> heartbeat(@PathVariable Long id) {
        focusSessionService.recordHeartbeat(id);
        return ApiResponse.success(null);
    }

    @PostMapping("/{sessionId}/cycle")
    public ApiResponse<FocusSessionResponse> completeCycle(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        FocusSessionResponse response = focusSessionService.completeCycle(sessionId, userDetails.getId());
        return ApiResponse.success(response);
    }

    @PatchMapping("/{sessionId}/end")
    public ApiResponse<FocusSessionResponse> endSession(
            @PathVariable Long sessionId,
            @RequestParam boolean isAborted,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        FocusSessionResponse response = focusSessionService.endSession(sessionId, userDetails.getId(), isAborted);
        return ApiResponse.success(response);
    }

    @PostMapping("/{sessionId}/violation")
    public ApiResponse<HandleViolationResponse> handleViolation(
            @PathVariable Long sessionId,
            @RequestBody ViolationRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        HandleViolationResponse response = focusSessionService.handleViolation(
                sessionId, userDetails.getId(), request);
        return ApiResponse.success(response);
    }

    @PostMapping("/{sessionId}/pause")
    public ApiResponse<FocusSessionResponse> pauseSession(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        FocusSessionResponse response = focusSessionService.pauseSession(sessionId, userDetails.getId());
        return ApiResponse.success(response);
    }

    @PostMapping("/{sessionId}/resume")
    public ApiResponse<FocusSessionResponse> resumeSession(
            @PathVariable Long sessionId,
            @RequestParam int minutesUsed,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        FocusSessionResponse response = focusSessionService.resumeSession(sessionId, userDetails.getId(), minutesUsed);
        return ApiResponse.success(response);
    }

    @GetMapping("/{sessionId}/break-prompt")
    public ApiResponse<BreakPromptAiResponse> getBreakPrompt(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        BreakPromptAiResponse response =
                focusSessionService.getBreakPrompt(sessionId, userDetails.getId());

        return ApiResponse.success(response);
    }

    @PostMapping("/{sessionId}/classify-app")
    public ApiResponse<ClassifyAndHandleViolationResponse> classifyAndHandleViolation(
            @PathVariable Long sessionId,
            @RequestBody ClassifyAppRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        ClassifyAndHandleViolationResponse response = focusSessionService.classifyAndHandleViolation(
                sessionId, userDetails.getId(), request);
        return ApiResponse.success(response);
    }
}