package com.exe101.exe.model.entity;


import com.exe101.exe.model.enums.OtpStatus;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.TimeToLive;
import org.springframework.data.redis.core.index.Indexed;

import java.io.Serializable;
import java.time.Instant;
import java.util.concurrent.TimeUnit;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString
@RedisHash(value = "otp")
public class OtpRedis implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    private String email;

    @Indexed
    private Long userId;

    private String code;

    @Builder.Default
    private int attempts = 0;

    private OtpStatus status;

    private Instant createdAt;

    private Instant expiredAt;

    @TimeToLive(unit = TimeUnit.SECONDS)
    private Long ttl;

    public boolean isMaxAttemptsReached(int maxAttempts) {
        return this.attempts >= maxAttempts;
    }

    public void incrementAttempts() {
        this.attempts++;
    }

    public boolean isExpired() {
        return Instant.now().isAfter(this.expiredAt);
    }
}