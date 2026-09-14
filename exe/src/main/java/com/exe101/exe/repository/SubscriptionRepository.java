package com.exe101.exe.repository;

import com.exe101.exe.model.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    boolean existsByUserIdAndIsActiveTrue(Long userId);

    @Query("SELECT s.user.id FROM Subscription s WHERE s.user.id IN :userIds AND s.isActive = true")
    Set<Long> findActivePremiumUserIds(@Param("userIds") List<Long> userIds);
}