package com.exe101.exe.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(
        name = "personalities",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_personality_code", columnNames = "code")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"userSettings", "focusSessions"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Personality {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Size(max = 50)
    @Column(nullable = false, length = 50)
    @EqualsAndHashCode.Include
    private String code;

    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_premium", nullable = false)
    @Builder.Default
    private boolean isPremium = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Builder.Default
    @OneToMany(mappedBy = "personality", fetch = FetchType.LAZY)
    private Set<UserSetting> userSettings = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "personality", fetch = FetchType.LAZY)
    private Set<FocusSession> focusSessions = new HashSet<>();

    public static Personality ref(Long id) {
        Personality p = new Personality();
        p.setId(id);
        return p;
    }
}