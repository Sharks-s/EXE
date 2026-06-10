package com.exe101.exe.service.impl;

import com.exe101.exe.dto.request.CreateSessionRequest;
import com.exe101.exe.dto.response.FocusSessionResponse;
import com.exe101.exe.service.FocusSessionService;
import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.mapper.FocusSessionMapper;
import com.exe101.exe.model.entity.FocusSession;
import com.exe101.exe.model.entity.Personality;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.enums.SessionStatus;
import com.exe101.exe.repository.FocusSessionRepository;
import com.exe101.exe.repository.PersonalityRepository;
import com.exe101.exe.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FocusSessionServiceImpl implements FocusSessionService {

    private final FocusSessionRepository focusSessionRepository;
    private final PersonalityRepository personalityRepository;
    private final FocusSessionMapper focusSessionMapper;
    private final UserService userService;

    @Override
    @Transactional
    public FocusSessionResponse createSession(CreateSessionRequest request, Long userId) {
        User user = userService.findById(userId);

        Personality personality = personalityRepository.findByCode(request.personality())
                .orElseThrow(() -> new BusinessException(ErrorCode.PERSONALITY_NOT_FOUND));

        int breakBank = request.durationMinutes() / 5;

        FocusSession session = FocusSession.builder()
                .user(user)
                .personality(personality)
                .goal(request.goal())
                .plannedDuration(request.durationMinutes())
                .breakBankInitial(breakBank)
                .breakBankFinal(breakBank)
                .status(SessionStatus.IN_PROGRESS)
                .startedAt(Instant.now())
                .build();

        return focusSessionMapper.toResponse(focusSessionRepository.save(session));
    }

    @Override
    @Transactional
    public FocusSessionResponse endSession(Long sessionId, Long userId) {
        FocusSession session = focusSessionRepository.findById(sessionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SESSION_NOT_FOUND));

        if (!session.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        if (session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new BusinessException(ErrorCode.SESSION_ALREADY_ENDED);
        }

        session.setStatus(SessionStatus.COMPLETED);
        session.setEndedAt(Instant.now());
        session.setActualDuration(
                (int) (Instant.now().getEpochSecond() - session.getStartedAt().getEpochSecond()) / 60
        );

        return focusSessionMapper.toResponse(session);
    }
}
