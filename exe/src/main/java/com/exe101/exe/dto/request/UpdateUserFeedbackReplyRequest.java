package com.exe101.exe.dto.request;

import jakarta.validation.constraints.Size;

public record UpdateUserFeedbackReplyRequest(
        @Size(max = 5000) String adminReply
) {}
