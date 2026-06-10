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

    @Column(name = "break_bank_initial")
    private Integer breakBankInitial;

    @Column(name = "break_bank_final")
    private Integer breakBankFinal;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private SessionStatus status;

    @CreationTimestamp
    @Column(name = "started_at", nullable = false, updatable = false)
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Builder.Default
    @OneToMany(mappedBy = "session", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Violation> violations = new HashSet<>();

    public void addViolation(Violation violation) {
        this.violations.add(violation);
        violation.setSession(this);
    }
}