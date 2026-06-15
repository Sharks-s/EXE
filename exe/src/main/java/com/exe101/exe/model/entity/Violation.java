package com.exe101.exe.model.entity;

import com.exe101.exe.model.enums.ViolationType;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "violations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"session"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Violation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false, foreignKey = @ForeignKey(name = "fk_violations_session"))
    private FocusSession session;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    private ViolationType type;

    @Column(name = "minutes_deducted", nullable = false)
    private int minutesDeducted;

    @Size(max = 150)
    @Column(name = "app_name", length = 150)
    private String appName;

    @Size(max = 255)
    @Column(name = "window_title", length = 255)
    private String windowTitle;

    @CreationTimestamp
    @Column(name = "occurred_at", nullable = false, updatable = false)
    private Instant occurredAt;
}