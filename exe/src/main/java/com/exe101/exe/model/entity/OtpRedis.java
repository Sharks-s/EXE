package com.exe101.exe.model.entity;

import com.exe101.exe.model.enums.OtpStatus;
import com.exe101.exe.model.enums.OtpType;
import lombok.*;

import java.io.Serializable;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"code", "codeHash"})
public class OtpRedis implements Serializable {

    private static final long serialVersionUID = 1L;

    private String email;
    private Long userId;
    private OtpType type;

    // Plaintext OTP — chỉ tồn tại trong bộ nhớ lúc generate/gửi mail, KHÔNG persist xuống Redis.
    private String code;

    // Giá trị thực sự lưu trong Redis, dùng để verify qua PasswordEncoder.matches()
    private String codeHash;

    @Builder.Default
    private int attempts = 0;

    private OtpStatus status;
    private Instant createdAt;
    private Instant expiredAt;

    public boolean isMaxAttemptsReached(int maxAttempts) {
        return this.attempts >= maxAttempts;
    }

    public boolean isExpired() {
        return expiredAt != null && Instant.now().isAfter(expiredAt);
    }
}
