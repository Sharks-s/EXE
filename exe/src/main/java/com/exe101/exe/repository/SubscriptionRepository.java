package com.exe101.exe.repository;

import com.exe101.exe.model.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    boolean existsByUserIdAndPlanIgnoreCase(Long userId, String plan);

    List<Subscription> findByUserIdAndIsActiveTrue(Long userId);

    @Query("""
            select count(s) > 0
            from Subscription s
            where s.user.id = :userId
              and s.isActive = true
              and upper(s.plan) in ('PRO', 'PREMIUM')
              and (s.expiresAt is null or s.expiresAt > :now)
            """)
    boolean hasActiveProAccess(@Param("userId") Long userId, @Param("now") Instant now);
}
