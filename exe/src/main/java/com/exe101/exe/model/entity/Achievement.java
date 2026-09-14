package com.exe101.exe.model.entity;

import com.exe101.exe.model.enums.AchievementCategory;
import com.exe101.exe.model.enums.AchievementRarity;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(
        name = "achievements",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_achievements_code", columnNames = "code")
        },
        indexes = {
                @Index(name = "idx_achievements_active", columnList = "active"),
                @Index(name = "idx_achievements_category", columnList = "category")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Achievement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @NotBlank
    @Size(max = 80)
    @Column(nullable = false, length = 80)
    private String code;

    @NotBlank
    @Size(max = 120)
    @Column(nullable = false, length = 120)
    private String name;

    @Size(max = 500)
    @Column(length = 500)
    private String description;

    @Size(max = 80)
    @Column(length = 80)
    private String icon;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AchievementCategory category;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AchievementRarity rarity;

    @Min(1)
    @Column(name = "target_value", nullable = false)
    private Integer targetValue;

    @Min(0)
    @Column(name = "reward_points", nullable = false)
    private Integer rewardPoints;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
