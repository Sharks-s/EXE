package com.exe101.exe.repository;

import com.exe101.exe.mapper.UserMapper;
import com.exe101.exe.model.entity.FocusSession;
import com.exe101.exe.model.enums.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FocusSessionRepository extends JpaRepository<FocusSession, Long> {
    boolean existsByUserIdAndStatus(Long userId, SessionStatus status);

    List<FocusSession> findByUserIdAndStatus(Long userId, SessionStatus status);

    Optional<FocusSession> findFirstByUserIdAndStatusOrderByStartedAtDesc(Long userId, SessionStatus status);
}