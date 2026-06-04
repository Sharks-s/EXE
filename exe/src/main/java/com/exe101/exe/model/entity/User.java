package com.exe101.exe.model.entity;

import com.exe101.exe.model.enums.UserStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(
        name = "users",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_users_email", columnNames = "email")
        },
        indexes = {
                @Index(name = "idx_users_email", columnList = "email"),
                @Index(name = "idx_users_status", columnList = "status")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"identities", "userRoles"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Size(max = 100)
    @Column(length = 100) // Đồng bộ độ dài validation với độ dài DB column
    private String name;

    @Email
    @Size(max = 150)
    @Column(nullable = false, length = 150)
    @EqualsAndHashCode.Include
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status;

    private Instant lastLoginAt;

    @Column(nullable = false)
    @Builder.Default
    private boolean profileCompleted = false;

    @Size(max = 512) // Giới hạn độ dài URL để tránh lỗi SQL hụt data
    @Column(name = "avatar_url", length = 512)
    private String avatarUrl;

    // Đổi sang CascadeType.MERGE, PERSIST, REFRESH, REMOVE thay vì ALL để kiểm soát hành vi chặt chẽ hơn
    @Builder.Default
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE, CascadeType.REMOVE}, orphanRemoval = true)
    private Set<UserIdentity> identities = new HashSet<>();

    // Thêm Cascade hoặc cân nhắc xử lý riêng qua Role, bật orphanRemoval nếu muốn xoá role trực tiếp qua User
    @Builder.Default
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<UserRole> userRoles = new HashSet<>();

    // GIẢI PHÁP XỊN: Thêm Version để chống hiện tượng Lost Update (Optimistic Locking) khi 2 request cùng sửa User một lúc
    @Version
    private Long version;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    // --- HELPER METHODS (Mấu chốt để code xịn hơn) ---
    // Vì đây là quan hệ 2 chiều (Bidirectional), nếu chỉ add vào Set của User mà không set User cho Identity thì JPA sẽ lưu lỗi hoặc null FK.

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

    // Factory method nhanh cho việc mapping hoặc test
    public static User ref(Long id) {
        User u = new User();
        u.setId(id);
        return u;
    }
}