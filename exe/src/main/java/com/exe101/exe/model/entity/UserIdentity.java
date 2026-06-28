package com.exe101.exe.model.entity;

import com.exe101.exe.model.enums.AuthProvider;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
        name = "user_identities",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_user_provider",
                        columnNames = {"user_id", "provider"}
                )
        },
        indexes = {
                // Thêm index cho cặp này để tối ưu câu lệnh SELECT khi tìm kiếm user đăng nhập bằng OAuth
                @Index(name = "idx_provider_provider_id", columnList = "provider, provider_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "user")
@EqualsAndHashCode(onlyExplicitlyIncluded = true) // Tránh bug Equals khi so sánh trong Set
public class UserIdentity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_identity_user"))
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @EqualsAndHashCode.Include
    private AuthProvider provider;

    @Column(name = "provider_id", length = 150)
    @EqualsAndHashCode.Include
    private String providerId;

    @Column(name = "password")
    private String password;

    @Column(name = "password_updated_at")
    private Instant passwordUpdatedAt;
}
