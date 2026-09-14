package com.exe101.exe.model.entity;

import com.exe101.exe.model.enums.PointTransactionType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(
        name = "point_transactions",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_point_transactions_idempotency",
                        columnNames = {"user_id", "reference_id", "type"}
                )
        },
        indexes = {
                @Index(name = "idx_point_transactions_user_created", columnList = "user_id, created_at"),
                @Index(name = "idx_point_transactions_reference", columnList = "reference_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "user")
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class PointTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_point_transactions_user"))
    private User user;

    @Column(nullable = false)
    private Integer amount;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private PointTransactionType type;

    @Size(max = 255)
    @Column(length = 255)
    private String reason;

    @NotNull
    @Size(max = 100)
    @Column(name = "reference_id", nullable = false, length = 100)
    private String referenceId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
