package com.exe101.exe.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(
        name = "point_wallets",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_point_wallets_user", columnNames = "user_id")
        },
        indexes = {
                @Index(name = "idx_point_wallets_user_id", columnList = "user_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "user")
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class PointWallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_point_wallets_user"))
    private User user;

    @Min(0)
    @Column(name = "current_points", nullable = false)
    @Builder.Default
    private Integer currentPoints = 0;

    @Min(0)
    @Column(name = "total_earned_points", nullable = false)
    @Builder.Default
    private Integer totalEarnedPoints = 0;

    @Min(0)
    @Column(name = "total_spent_points", nullable = false)
    @Builder.Default
    private Integer totalSpentPoints = 0;

    @Version
    private Long version;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
