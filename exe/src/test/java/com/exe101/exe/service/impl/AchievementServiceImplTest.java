package com.exe101.exe.service.impl;

import com.exe101.exe.config.AppSeedProperties;
import com.exe101.exe.dto.response.UnlockedAchievementResponse;
import com.exe101.exe.model.entity.Achievement;
import com.exe101.exe.model.entity.FocusSession;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.entity.UserAchievement;
import com.exe101.exe.model.enums.AchievementCategory;
import com.exe101.exe.model.enums.AchievementRarity;
import com.exe101.exe.model.enums.PointTransactionType;
import com.exe101.exe.model.enums.SessionStatus;
import com.exe101.exe.model.enums.UserAchievementStatus;
import com.exe101.exe.repository.AchievementRepository;
import com.exe101.exe.repository.FocusSessionRepository;
import com.exe101.exe.repository.UserAchievementRepository;
import com.exe101.exe.service.PointService;
import com.exe101.exe.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AchievementServiceImplTest {

    @Mock
    private AchievementRepository achievementRepository;

    @Mock
    private UserAchievementRepository userAchievementRepository;

    @Mock
    private FocusSessionRepository focusSessionRepository;

    @Mock
    private UserService userService;

    @Mock
    private PointService pointService;

    private AchievementServiceImpl achievementService;

    @BeforeEach
    void setUp() {
        achievementService = new AchievementServiceImpl(
                achievementRepository,
                userAchievementRepository,
                focusSessionRepository,
                userService,
                pointService,
                new AppSeedProperties()
        );
    }

    @Test
    void checkSessionCompletedAchievementsUnlocksAndCreditsReward() {
        User user = User.builder().id(1L).email("user@example.com").build();
        Achievement firstFocus = Achievement.builder()
                .id(10L)
                .code("FIRST_FOCUS")
                .name("First Focus")
                .category(AchievementCategory.SESSION)
                .rarity(AchievementRarity.COMMON)
                .targetValue(1)
                .rewardPoints(20)
                .active(true)
                .build();
        FocusSession completedSession = FocusSession.builder()
                .id(100L)
                .user(user)
                .status(SessionStatus.COMPLETED)
                .startedAt(Instant.now())
                .activeSeconds(15 * 60)
                .distractionCount(0)
                .distractionSeconds(0)
                .build();

        when(achievementRepository.findByActiveTrueAndCategoryInOrderByCategoryAscTargetValueAsc(any(Collection.class)))
                .thenReturn(List.of(firstFocus));
        when(userAchievementRepository.findByUserIdAndAchievementIdInWithAchievementForUpdate(eq(1L), eq(List.of(10L))))
                .thenReturn(List.of());
        when(userService.findById(1L)).thenReturn(user);
        when(focusSessionRepository.countByUserIdAndStatus(1L, SessionStatus.COMPLETED)).thenReturn(1L);
        when(focusSessionRepository.sumDurationByUserIdAndStatus(1L, SessionStatus.COMPLETED)).thenReturn(15);
        when(focusSessionRepository.findByUserIdAndStartedAtGreaterThanEqualAndStartedAtLessThanOrderByStartedAtAsc(
                eq(1L), any(Instant.class), any(Instant.class)
        )).thenReturn(List.of(completedSession));

        List<UnlockedAchievementResponse> unlocked = achievementService.checkSessionCompletedAchievements(1L);

        assertEquals(1, unlocked.size());
        assertEquals("FIRST_FOCUS", unlocked.getFirst().code());

        ArgumentCaptor<UserAchievement> userAchievementCaptor = ArgumentCaptor.forClass(UserAchievement.class);
        verify(userAchievementRepository).saveAndFlush(userAchievementCaptor.capture());
        UserAchievement saved = userAchievementCaptor.getValue();
        assertEquals(UserAchievementStatus.UNLOCKED, saved.getStatus());
        assertEquals(1, saved.getProgress());

        verify(pointService).creditWallet(
                1L,
                20,
                PointTransactionType.ACHIEVEMENT_REWARD,
                "Achievement unlocked: FIRST_FOCUS",
                "10"
        );
    }
}
