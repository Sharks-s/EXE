package com.exe101.exe.security.oauth;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Lưu one-time code -> refreshToken trong bộ nhớ. TTL 60s, dùng một lần.
 * Lưu ý: chỉ đúng khi chạy 1 instance. Nhiều instance thì đổi sang Redis
 * (đã có RegisterSessionStore dùng Redis, có thể làm tương tự).
 */
@Component
public class OAuthCodeStore {

    private static final Duration TTL = Duration.ofSeconds(60);
    private static final SecureRandom RANDOM = new SecureRandom();

    private record Entry(String refreshToken, Instant expiresAt) {}

    private final Map<String, Entry> store = new ConcurrentHashMap<>();

    public String issue(String refreshToken) {
        purgeExpired();
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String code = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        store.put(code, new Entry(refreshToken, Instant.now().plus(TTL)));
        return code;
    }

    /** Lấy và xóa ngay. Trả empty nếu không tồn tại hoặc hết hạn. */
    public Optional<String> consume(String code) {
        if (code == null) return Optional.empty();
        Entry entry = store.remove(code);
        if (entry == null || entry.expiresAt().isBefore(Instant.now())) {
            return Optional.empty();
        }
        return Optional.of(entry.refreshToken());
    }

    private void purgeExpired() {
        Instant now = Instant.now();
        store.entrySet().removeIf(e -> e.getValue().expiresAt().isBefore(now));
    }
}