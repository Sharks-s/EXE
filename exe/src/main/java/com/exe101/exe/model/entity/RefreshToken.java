package com.exe101.exe.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(
        name = "refresh_tokens",
        indexes = {
                @Index(name = "idx_refresh_token_token", columnList = "token"),
                @Index(name = "idx_refresh_token_user_id", columnList = "userId"),
                @Index(name = "idx_refresh_token_jti", columnList = "jti"),
                @Index(name = "idx_refresh_token_device_id", columnList = "deviceId")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // DB internal id

    @Column(nullable = false, unique = true, length = 500)
    private String token; // hashed refresh token

    @Column(nullable = false, unique = true, length = 36)
    private String jti; // tokenId (UUID)

    @Column(nullable = false, length = 36)
    private String deviceId; // device/session identifier (UUID)

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    @Builder.Default
    private boolean revoked = false;

    @Column(nullable = false)
    private Instant expiresAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    public boolean isExpired() {
        return expiresAt.isBefore(Instant.now());
    }

    public void revoke() {
        this.revoked = true;
    }
}
