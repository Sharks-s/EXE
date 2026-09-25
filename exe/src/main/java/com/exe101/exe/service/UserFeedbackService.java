package com.exe101.exe.service;

import com.exe101.exe.dto.request.CreateUserFeedbackRequest;
import com.exe101.exe.dto.request.UpdateUserFeedbackReplyRequest;
import com.exe101.exe.dto.request.UpdateUserFeedbackStatusRequest;
import com.exe101.exe.dto.response.UserFeedbackResponse;

import java.util.List;

public interface UserFeedbackService {
    UserFeedbackResponse create(Long userId, CreateUserFeedbackRequest request);

    List<UserFeedbackResponse> getMyFeedbacks(Long userId);

    UserFeedbackResponse getMyFeedback(Long userId, Long feedbackId);

    List<UserFeedbackResponse> adminGetAll();

    UserFeedbackResponse adminUpdateStatus(Long feedbackId, UpdateUserFeedbackStatusRequest request);

    UserFeedbackResponse adminUpdateReply(Long feedbackId, UpdateUserFeedbackReplyRequest request);
}
