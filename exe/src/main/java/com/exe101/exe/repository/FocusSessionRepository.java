package com.exe101.exe.repository;

import com.exe101.exe.model.entity.FocusSession;
import com.exe101.exe.model.enums.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FocusSessionRepository extends JpaRepository<FocusSession, Long> {
    boolean existsByUserIdAndStatus(Long userId, SessionStatus status);

    List<FocusSession> findByUserIdAndStatus(Long userId, SessionStatus status);
}