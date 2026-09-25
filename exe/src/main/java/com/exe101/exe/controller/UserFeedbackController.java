package com.exe101.exe.controller;

import com.exe101.exe.dto.request.CreateUserFeedbackRequest;
import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.dto.response.UserFeedbackResponse;
import com.exe101.exe.security.CustomUserDetails;
import com.exe101.exe.service.UserFeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user-feedbacks")
@RequiredArgsConstructor
public class UserFeedbackController {

    private final UserFeedbackService userFeedbackService;

    @PostMapping
    public ApiResponse<UserFeedbackResponse> create(
            @Valid @RequestBody CreateUserFeedbackRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success(userFeedbackService.create(userDetails.getId(), request));
    }

    @GetMapping("/me")
    public ApiResponse<List<UserFeedbackResponse>> getMyFeedbacks(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success(userFeedbackService.getMyFeedbacks(userDetails.getId()));
    }

    @GetMapping("/me/{id}")
    public ApiResponse<UserFeedbackResponse> getMyFeedback(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success(userFeedbackService.getMyFeedback(userDetails.getId(), id));
    }
}
