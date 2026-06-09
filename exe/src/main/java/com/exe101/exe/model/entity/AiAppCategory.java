package com.exe101.exe.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(
        name = "ai_app_categories",
        indexes = {
                @Index(name = "idx_ai_app_name", columnList = "app_name")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class AiAppCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Size(max = 150)
    @Column(name = "app_name", length = 150, nullable = false)
    private String appName;

    @Size(max = 255)
    @Column(name = "window_title", length = 255)
    private String windowTitle;

    @Column(length = 20, nullable = false)
    private String label; // HOC, LUOI_BIENG

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}