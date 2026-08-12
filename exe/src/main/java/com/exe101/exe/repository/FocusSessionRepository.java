package com.exe101.exe.repository;

import com.exe101.exe.model.entity.FocusSession;
import com.exe101.exe.model.enums.SessionStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface FocusSessionRepository extends JpaRepository<FocusSession, Long> {
    boolean existsByUserIdAndStatus(Long userId, SessionStatus status);

    List<FocusSession> findByUserIdAndStatus(Long userId, SessionStatus status);

    Optional<FocusSession> findFirstByUserIdAndStatusOrderByStartedAtDesc(Long userId, SessionStatus status);

    List<FocusSession> findByUserIdAndStartedAtGreaterThanEqualAndStartedAtLessThanOrderByStartedAtAsc(
            Long userId,
            Instant from,
            Instant to
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM FocusSession s WHERE s.id = :id")
    Optional<FocusSession> findByIdForUpdate(@Param("id") Long id);
}
