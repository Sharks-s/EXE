package com.exe101.exe.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(
        name = "user_roles",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "role_id"}),
        indexes = {
                @Index(columnList = "user_id"),
                @Index(columnList = "role_id"),
                @Index(columnList = "is_active")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class UserRole {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @EqualsAndHashCode.Include
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    @EqualsAndHashCode.Include
    private Role role;

    //------------------------
    @Column(name = "assigned_at", nullable = false)
    private Instant assignedAt;

    @Column(name = "assigned_by")
    private Long assignedBy;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    //------------------------
    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}
