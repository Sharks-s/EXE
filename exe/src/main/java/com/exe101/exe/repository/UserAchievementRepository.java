package com.exe101.exe.repository;

import com.exe101.exe.model.entity.UserAchievement;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserAchievementRepository extends JpaRepository<UserAchievement, Long> {
    Optional<UserAchievement> findByUserIdAndAchievementId(Long userId, Long achievementId);

    @Query("SELECT ua FROM UserAchievement ua JOIN FETCH ua.achievement WHERE ua.user.id = :userId")
    List<UserAchievement> findAllByUserIdWithAchievement(@Param("userId") Long userId);

    @Query("SELECT ua FROM UserAchievement ua JOIN FETCH ua.achievement WHERE ua.user.id = :userId AND ua.achievement.id IN :achievementIds")
    List<UserAchievement> findByUserIdAndAchievementIdInWithAchievement(
            @Param("userId") Long userId,
            @Param("achievementIds") Collection<Long> achievementIds
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ua FROM UserAchievement ua JOIN FETCH ua.achievement WHERE ua.user.id = :userId AND ua.achievement.id IN :achievementIds")
    List<UserAchievement> findByUserIdAndAchievementIdInWithAchievementForUpdate(
            @Param("userId") Long userId,
            @Param("achievementIds") Collection<Long> achievementIds
    );
}
