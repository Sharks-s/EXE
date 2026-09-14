package com.exe101.exe.service.impl;

import com.exe101.exe.dto.response.AdminSessionMonitorItem;
import com.exe101.exe.model.entity.FocusSession;
import com.exe101.exe.model.enums.SessionStatus;
import com.exe101.exe.repository.FocusSessionRepository;
import com.exe101.exe.service.AdminSessionMonitorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminSessionMonitorServiceImpl implements AdminSessionMonitorService {

    private final FocusSessionRepository focusSessionRepository;

    @Override
    public List<AdminSessionMonitorItem> getActiveSessions() {
        return focusSessionRepository.findAllByStatusWithDetails(SessionStatus.IN_PROGRESS)
                .stream()
                .map(this::toItem)
                .toList();
    }

    private AdminSessionMonitorItem toItem(FocusSession s) {
        return new AdminSessionMonitorItem(
                s.getId(),
                s.getUser().getId(),
                s.getUser().getEmail(),
                s.getUser().getFullName(),
                s.getGoal(),
                s.getPlannedDuration(),
                s.getStartedAt(),
                s.getLastHeartbeatAt(),
                s.getPersonality() != null ? s.getPersonality().getCode() : null,
                s.getUserPet() != null && s.getUserPet().getPet() != null
                        ? s.getUserPet().getPet().getName() : null,
                s.getPausedAt() != null
        );
    }
}