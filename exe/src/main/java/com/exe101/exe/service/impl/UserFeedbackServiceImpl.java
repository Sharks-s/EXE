package com.exe101.exe.service.impl;

import com.exe101.exe.dto.request.CreateUserFeedbackRequest;
import com.exe101.exe.dto.request.UpdateUserFeedbackReplyRequest;
import com.exe101.exe.dto.request.UpdateUserFeedbackStatusRequest;
import com.exe101.exe.dto.response.UserFeedbackResponse;
import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.entity.UserFeedback;
import com.exe101.exe.model.enums.UserFeedbackStatus;
import com.exe101.exe.repository.UserFeedbackRepository;
import com.exe101.exe.service.UserFeedbackService;
import com.exe101.exe.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserFeedbackServiceImpl implements UserFeedbackService {

    private final UserFeedbackRepository userFeedbackRepository;
    private final UserService userService;

    @Override
    @Transactional
    public UserFeedbackResponse create(Long userId, CreateUserFeedbackRequest request) {
        User user = userService.findById(userId);

        UserFeedback feedback = UserFeedback.builder()
                .user(user)
                .type(request.type())
                .title(request.title().trim())
                .content(request.content().trim())
                .rating(request.rating())
                .status(UserFeedbackStatus.NEW)
                .build();

        return toResponse(userFeedbackRepository.saveAndFlush(feedback));
    }

    @Override
    public List<UserFeedbackResponse> getMyFeedbacks(Long userId) {
        return userFeedbackRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public UserFeedbackResponse getMyFeedback(Long userId, Long feedbackId) {
        return userFeedbackRepository.findByIdAndUserId(feedbackId, userId)
                .map(this::toResponse)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_FEEDBACK_NOT_FOUND));
    }

    @Override
    public List<UserFeedbackResponse> adminGetAll() {
        return userFeedbackRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public UserFeedbackResponse adminUpdateStatus(Long feedbackId, UpdateUserFeedbackStatusRequest request) {
        UserFeedback feedback = findById(feedbackId);
        feedback.setStatus(request.status());
        return toResponse(userFeedbackRepository.saveAndFlush(feedback));
    }

    @Override
    @Transactional
    public UserFeedbackResponse adminUpdateReply(Long feedbackId, UpdateUserFeedbackReplyRequest request) {
        UserFeedback feedback = findById(feedbackId);
        feedback.setAdminReply(hasText(request.adminReply()) ? request.adminReply().trim() : null);
        return toResponse(userFeedbackRepository.saveAndFlush(feedback));
    }

    private UserFeedback findById(Long feedbackId) {
        return userFeedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_FEEDBACK_NOT_FOUND));
    }

    private UserFeedbackResponse toResponse(UserFeedback feedback) {
        return UserFeedbackResponse.builder()
                .id(feedback.getId())
                .userId(feedback.getUser().getId())
                .type(feedback.getType())
                .title(feedback.getTitle())
                .content(feedback.getContent())
                .rating(feedback.getRating())
                .status(feedback.getStatus())
                .adminReply(feedback.getAdminReply())
                .createdAt(feedback.getCreatedAt())
                .updatedAt(feedback.getUpdatedAt())
                .build();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
