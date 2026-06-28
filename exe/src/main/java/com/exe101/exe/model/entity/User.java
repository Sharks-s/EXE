package com.exe101.exe.model.entity;

import com.exe101.exe.model.enums.UserGender;
import com.exe101.exe.model.enums.UserStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(
        name = "users",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_users_email", columnNames = "email")
        },
        indexes = {
                @Index(name = "idx_users_email", columnList = "email")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"identities", "userRoles", "refreshTokens", "userSetting", "focusSessions", "subscriptions", "appRules", "userPets"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Email
    @Size(max = 150)
    @Column(nullable = false, length = 150)
    @EqualsAndHashCode.Include
    private String email;

    @Size(max = 100)
    @Column(name = "full_name", length = 100)
    private String fullName;

    @Size(max = 512)
    @Column(name = "avatar_url", length = 512)
    private String avatarUrl;

    @Column(name = "avatar_public_id")
    private String avatarPublicId;

    @Column(nullable = false)
    @Builder.Default
    private boolean profileCompleted = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status;

    private Instant lastLoginAt;

    @Builder.Default
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<UserRole> userRoles = new HashSet<>();

    @Column(name = "daily_used_minutes", nullable = false)
    @Builder.Default
    private Integer dailyUsedMinutes = 0;

    @Column(name = "last_usage_date")
    private Instant lastUsageDate;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender")
    private UserGender gender;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Version
    private Long version;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "address_line", length = 255)
    private String addressLine;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "province_code")
    private Province province;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ward_code")
    private Ward ward;

    // --- RELATIONS ---
    @Builder.Default
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<UserIdentity> identities = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<RefreshToken> refreshTokens = new HashSet<>();

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private UserSetting userSetting;

    @Builder.Default
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<FocusSession> focusSessions = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Subscription> subscriptions = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<AppRule> appRules = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<UserPet> userPets = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "personality_id", foreignKey = @ForeignKey(name = "fk_users_personality"))
    private Personality personality;

    // --- HELPER METHODS ---
    public void addIdentity(UserIdentity identity) {
        this.identities.add(identity);
        identity.setUser(this);
    }

    public void removeIdentity(UserIdentity identity) {
        this.identities.remove(identity);
        identity.setUser(null);
    }
    public void addUserRole(UserRole userRole) {
        this.userRoles.add(userRole);
        userRole.setUser(this);
    }
    // Các helper methods tương tự cho RefreshToken, FocusSession, Subscription... có thể được thêm vào đây
    public void setUserSetting(UserSetting userSetting) {
        if (userSetting == null) {
            if (this.userSetting != null) {
                this.userSetting.setUser(null);
            }
        } else {
            userSetting.setUser(this);
        }
        this.userSetting = userSetting;
    }


    public void addUserPet(UserPet userPet) {
        this.userPets.add(userPet);
        userPet.setUser(this);
    }

    public void removeUserPet(UserPet userPet) {
        this.userPets.remove(userPet);
        userPet.setUser(null);
    }
}
