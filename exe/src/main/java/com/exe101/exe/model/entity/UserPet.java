package com.exe101.exe.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(
        name = "user_pets",
        indexes = {
                @Index(name = "idx_user_pets_user_id", columnList = "user_id"),
                @Index(name = "idx_user_pets_pet_id", columnList = "pet_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"user", "pet"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class UserPet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_user_pets_user"))
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_id", nullable = false, foreignKey = @ForeignKey(name = "fk_user_pets_pet"))
    private Pet pet;

    @NotBlank
    @Size(max = 100)
    @Column(name = "custom_name", nullable = false, length = 100)
    private String customName; // Tên riêng do user tự đặt cho Pet

    @Min(1)
    @Column(nullable = false)
    @Builder.Default
    private Integer level = 1;

    @Min(0)
    @Column(nullable = false)
    @Builder.Default
    private Integer experience = 0;

    @Column(name = "is_equipped", nullable = false)
    @Builder.Default
    private boolean equipped = false; // Có đang được chọn hiển thị trên Dashboard không

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}