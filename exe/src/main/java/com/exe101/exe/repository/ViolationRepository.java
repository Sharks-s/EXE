package com.exe101.exe.repository;

import com.exe101.exe.model.entity.Violation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface ViolationRepository extends JpaRepository<Violation, Long> {
    List<Violation> findBySessionUserIdAndOccurredAtGreaterThanEqualAndOccurredAtLessThan(
            Long userId,
            Instant from,
            Instant to
    );
}
