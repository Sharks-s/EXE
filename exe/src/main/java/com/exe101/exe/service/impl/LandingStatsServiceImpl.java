package com.exe101.exe.service.impl;

import com.exe101.exe.dto.response.LandingStatsResponse;
import com.exe101.exe.dto.response.LandingTestimonialResponse;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.entity.UserFeedback;
import com.exe101.exe.model.enums.UserFeedbackStatus;
import com.exe101.exe.model.enums.SessionStatus;
import com.exe101.exe.repository.FocusSessionRepository;
import com.exe101.exe.repository.UserFeedbackRepository;
import com.exe101.exe.repository.UserPetRepository;
import com.exe101.exe.service.LandingStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LandingStatsServiceImpl implements LandingStatsService {

    private final FocusSessionRepository focusSessionRepository;
    private final UserPetRepository userPetRepository;
    private final UserFeedbackRepository userFeedbackRepository;

    @Override
    public LandingStatsResponse getStats() {
        long totalSessions = focusSessionRepository.count();
        long completedSessions = focusSessionRepository.countByStatus(SessionStatus.COMPLETED);
        long totalFocusMinutes = focusSessionRepository.sumDurationByStatus(SessionStatus.COMPLETED);
        long raisedBuddies = userPetRepository.count();
        double completionRate = totalSessions == 0
                ? 0.0
                : Math.round((completedSessions * 1000.0 / totalSessions)) / 10.0;

        return new LandingStatsResponse(
                totalFocusMinutes,
                completedSessions,
                completionRate,
                raisedBuddies
        );
    }

    @Override
    public List<LandingTestimonialResponse> getTestimonials() {
        return userFeedbackRepository.findLandingTestimonials(
                        4,
                        UserFeedbackStatus.RESOLVED,
                        PageRequest.of(0, 8)
                )
                .stream()
                .map(this::toTestimonialResponse)
                .toList();
    }

    private LandingTestimonialResponse toTestimonialResponse(UserFeedback feedback) {
        User user = feedback.getUser();

        return new LandingTestimonialResponse(
                feedback.getId(),
                hasText(user.getFullName()) ? user.getFullName().trim() : "FocusBuddy user",
                "Sinh vien",
                feedback.getContent().trim(),
                feedback.getRating()
        );
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
