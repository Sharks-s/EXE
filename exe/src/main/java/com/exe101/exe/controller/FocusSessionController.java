package com.exe101.exe.controller;

import com.exe101.exe.dto.request.CreateSessionRequest;
import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.dto.response.FocusSessionResponse;
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
    public ResponseEntity<ApiResponse<FocusSessionResponse>> createSession(
            @Valid @RequestBody CreateSessionRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        FocusSessionResponse response = focusSessionService.createSession(request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{sessionId}/end")
    public ResponseEntity<ApiResponse<FocusSessionResponse>> endSession(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        FocusSessionResponse response = focusSessionService.endSession(sessionId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}