package com.exe101.exe.model.entity;

import com.exe101.exe.model.enums.UserFeedbackStatus;
import com.exe101.exe.model.enums.UserFeedbackType;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(
        name = "user_feedbacks",
        indexes = {
                @Index(name = "idx_user_feedbacks_user_id", columnList = "user_id"),
                @Index(name = "idx_user_feedbacks_status", columnList = "status"),
                @Index(name = "idx_user_feedbacks_created_at", columnList = "created_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"user"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class UserFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_user_feedbacks_user"))
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private UserFeedbackType type;

    @Size(max = 150)
    @Column(nullable = false, length = 150)
    private String title;

    @Size(max = 5000)
    @Column(nullable = false, length = 5000)
    private String content;

    @Min(1)
    @Max(5)
    private Integer rating;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserFeedbackStatus status;

    @Size(max = 5000)
    @Column(name = "admin_reply", length = 5000)
    private String adminReply;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
