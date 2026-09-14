package com.exe101.exe.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.exe101.exe.model.enums.PetRarity;

import java.time.Instant;

@Entity
@Table(
        name = "pets",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_pets_code", columnNames = "code")
        },
        indexes = {
                @Index(name = "idx_pets_code", columnList = "code")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Pet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @NotBlank
    @Size(max = 50)
    @Column(nullable = false, length = 50)
    @EqualsAndHashCode.Include
    private String code; // Ví dụ: "GOLD_FISH", "SHIBA_INU"

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String name; // Tên loài gốc: "Cá Vàng", "Chó Shiba"

    @Size(max = 512)
    @Column(length = 512)
    private String description;

    @Size(max = 512)
    @Column(name = "image_url", length = 512)
    private String imageUrl;

    @Size(max = 512)
    @Column(name = "avatar_public_id", length = 512)
    private String avatarPublicId;

    @Column(name = "is_premium", nullable = false)
    @Builder.Default
    private boolean premium = false; // Pet vip hay pet free

    @Min(0)
    @Column(nullable = false, columnDefinition = "integer default 120")
    @Builder.Default
    private Integer price = 120;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30, columnDefinition = "varchar(30) default 'BASIC'")
    @Builder.Default
    private PetRarity rarity = PetRarity.BASIC;

    @Column(nullable = false, columnDefinition = "boolean default true")
    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // Static helper method để tham chiếu nhanh giống bên User của bạn
    public static Pet ref(Long id) {
        Pet p = new Pet();
        p.setId(id);
        return p;
    }
}
