package com.exe101.exe.controller;

import com.exe101.exe.dto.request.UpdateUserFeedbackReplyRequest;
import com.exe101.exe.dto.request.UpdateUserFeedbackStatusRequest;
import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.dto.response.UserFeedbackResponse;
import com.exe101.exe.service.UserFeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/user-feedbacks")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserFeedbackController {

    private final UserFeedbackService userFeedbackService;

    @GetMapping
    public ApiResponse<List<UserFeedbackResponse>> getAll() {
        return ApiResponse.success(userFeedbackService.adminGetAll());
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<UserFeedbackResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserFeedbackStatusRequest request
    ) {
        return ApiResponse.success(userFeedbackService.adminUpdateStatus(id, request));
    }

    @PatchMapping("/{id}/reply")
    public ApiResponse<UserFeedbackResponse> updateReply(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserFeedbackReplyRequest request
    ) {
        return ApiResponse.success(userFeedbackService.adminUpdateReply(id, request));
    }
}
