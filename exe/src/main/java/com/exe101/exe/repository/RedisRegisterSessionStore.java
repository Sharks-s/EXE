package com.exe101.exe.repository;

import com.exe101.exe.model.entity.RegisterSession;
import com.exe101.exe.model.enums.OtpType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class RedisRegisterSessionStore implements RegisterSessionStore {
    private final StringRedisTemplate redis;

    private String key(String token) {
        return "register:session:" + token;
    }

    @Override
    public void save(String token, RegisterSession session, Duration ttl) {
        String k = key(token);
        redis.opsForHash().put(k, "userId", String.valueOf(session.getUserId()));
        redis.opsForHash().put(k, "email", session.getEmail());
        redis.opsForHash().put(k, "type", session.getType().name());
        redis.opsForHash().put(k, "expiresAt", session.getExpiresAt().toString());
        redis.expire(k, ttl);
    }

    @Override
    public Optional<RegisterSession> get(String token) {
        String k = key(token);
        if (!Boolean.TRUE.equals(redis.hasKey(k))) return Optional.empty();

        Map<Object, Object> map = redis.opsForHash().entries(k);
        if (map.isEmpty()) return Optional.empty();

        return Optional.of(RegisterSession.builder()
                .userId(Long.parseLong((String) map.get("userId")))
                .email((String) map.get("email"))
                .type(OtpType.valueOf((String) map.getOrDefault("type", OtpType.REGISTER.name())))
                .expiresAt(Instant.parse((String) map.get("expiresAt")))
                .build());
    }

    @Override
    public void delete(String token) {
        redis.delete(key(token));
    }
}
