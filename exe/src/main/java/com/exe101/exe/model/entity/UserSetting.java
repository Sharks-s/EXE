package com.exe101.exe.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "user_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"user", "personality"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class UserSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true, foreignKey = @ForeignKey(name = "fk_user_settings_user"))
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "personality_id", foreignKey = @ForeignKey(name = "fk_user_settings_personality"))
    private Personality personality;

    @Column(name = "focus_duration_mins", nullable = false)
    @Builder.Default
    private Integer focusDurationMins = 50;

    @Column(name = "break_bank_mins", nullable = false)
    @Builder.Default
    private Integer breakBankMins = 10;

    @Column(name = "camera_enabled", nullable = false)
    @Builder.Default
    private boolean cameraEnabled = true;

    @Version
    private Long version;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}