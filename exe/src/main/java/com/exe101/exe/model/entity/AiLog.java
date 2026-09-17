package com.exe101.exe.model.entity;

import com.exe101.exe.model.enums.AiCallStatus;
import com.exe101.exe.model.enums.JsonParseStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(
        name = "ai_logs",
        indexes = {
                @Index(name = "idx_ai_logs_feature", columnList = "feature"),
                @Index(name = "idx_ai_logs_status", columnList = "status"),
                @Index(name = "idx_ai_logs_json_parse_status", columnList = "json_parse_status"),
                @Index(name = "idx_ai_logs_created_at", columnList = "created_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 50, nullable = false)
    private String provider;

    @Column(length = 100, nullable = false)
    private String model;

    @Column(length = 100)
    private String feature;

    @Column(name = "prompt_name", length = 100)
    private String promptName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AiCallStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "json_parse_status", length = 20)
    private JsonParseStatus jsonParseStatus;

    @Column(name = "json_parse_error", columnDefinition = "TEXT")
    private String jsonParseError;

    @Column(name = "input_tokens")
    private Integer inputTokens;

    @Column(name = "output_tokens")
    private Integer outputTokens;

    @Column(name = "total_tokens")
    private Integer totalTokens;

    @Column(name = "cost_usd", precision = 12, scale = 6)
    private BigDecimal costUsd;

    @Column(name = "latency_ms")
    private Long latencyMs;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
