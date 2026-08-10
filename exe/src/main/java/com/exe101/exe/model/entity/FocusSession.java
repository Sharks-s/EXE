package com.exe101.exe.model.entity;

import com.exe101.exe.model.enums.SessionStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(
        name = "focus_sessions",
        indexes = {
                @Index(name = "idx_focus_session_status", columnList = "status"),
                @Index(name = "idx_focus_session_started", columnList = "started_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"user", "personality", "violations"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class FocusSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_focus_sessions_user"))
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "personality_id", foreignKey = @ForeignKey(name = "fk_focus_sessions_personality"))
    private Personality personality;

    @Column(name = "goal", length = 255)
    private String goal;

    @Column(name = "planned_duration")
    private Integer plannedDuration;

    @Column(name = "actual_duration")
    private Integer actualDuration;

    @Column(name = "last_heartbeat_at")
    private Instant lastHeartbeatAt;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private SessionStatus status;

    @CreationTimestamp
    @Column(name = "started_at", nullable = false, updatable = false)
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "paused_at")
    private Instant pausedAt;

    @Column(name = "paused_minutes", nullable = false)
    @Builder.Default
    private Integer pausedMinutes = 0;

    @Column(name = "total_reward_pool", nullable = false)
    private Integer totalRewardPool; // Tổng quỹ thưởng gốc ban đầu (Ví dụ: 10 phút)

    @Column(name = "potential_reward", nullable = false)
    private Integer potentialReward; // Quỹ thưởng tương lai còn lại (Giảm dần khi chuyển hóa hoặc bị phạt)

    @Column(name = "last_cycle_at")
    private Instant lastCycleAt;

    @Column(name = "break_count", nullable = false)
    @Builder.Default
    private Integer breakCount = 0;

    @Column(name = "accumulated_reward", nullable = false)
    @Builder.Default
    private Integer accumulatedReward = 0; // Quỹ thưởng thực tế đã thu thập

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_pet_id", foreignKey = @ForeignKey(name = "fk_focus_sessions_user_pet"))
    private UserPet userPet;

    @Builder.Default
    @OneToMany(mappedBy = "session", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Violation> violations = new HashSet<>();

    public void addViolation(Violation violation) {
        this.violations.add(violation);
        violation.setSession(this);
    }
}