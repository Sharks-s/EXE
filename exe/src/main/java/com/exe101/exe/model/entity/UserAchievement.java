package com.exe101.exe.model.entity;

import com.exe101.exe.model.enums.UserAchievementStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(
        name = "user_achievements",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_user_achievements_user_achievement", columnNames = {"user_id", "achievement_id"})
        },
        indexes = {
                @Index(name = "idx_user_achievements_user", columnList = "user_id"),
                @Index(name = "idx_user_achievements_status", columnList = "status")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"user", "achievement"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class UserAchievement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_user_achievements_user"))
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "achievement_id", nullable = false, foreignKey = @ForeignKey(name = "fk_user_achievements_achievement"))
    private Achievement achievement;

    @Min(0)
    @Column(nullable = false)
    @Builder.Default
    private Integer progress = 0;

    @Min(1)
    @Column(name = "target_value", nullable = false)
    private Integer targetValue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private UserAchievementStatus status = UserAchievementStatus.LOCKED;

    @Column(name = "unlocked_at")
    private Instant unlockedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
