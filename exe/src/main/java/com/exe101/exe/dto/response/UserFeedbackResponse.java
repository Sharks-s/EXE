package com.exe101.exe.dto.response;

import com.exe101.exe.model.enums.UserFeedbackStatus;
import com.exe101.exe.model.enums.UserFeedbackType;
import lombok.Builder;

import java.time.Instant;

@Builder
public record UserFeedbackResponse(
        Long id,
        Long userId,
        UserFeedbackType type,
        String title,
        String content,
        Integer rating,
        UserFeedbackStatus status,
        String adminReply,
        Instant createdAt,
        Instant updatedAt
) {}
