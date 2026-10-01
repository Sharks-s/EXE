package com.exe101.exe.repository;

import com.exe101.exe.model.entity.RegisterSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Repository
@RequiredArgsConstructor
public class InMemoryRegisterSessionStore implements RegisterSessionStore {

    private final ConcurrentMap<String, StoredRegisterSession> sessions = new ConcurrentHashMap<>();

    @Override
    public void save(String sessionToken, RegisterSession session, Duration ttl) {
        sessions.put(sessionToken, new StoredRegisterSession(session, Instant.now().plus(ttl)));
    }

    @Override
    public Optional<RegisterSession> get(String sessionToken) {
        StoredRegisterSession stored = sessions.get(sessionToken);
        if (stored == null) {
            return Optional.empty();
        }
        if (stored.isExpired()) {
            sessions.remove(sessionToken);
            return Optional.empty();
        }
        return Optional.of(stored.session());
    }

    @Override
    public void delete(String sessionToken) {
        sessions.remove(sessionToken);
    }

    private record StoredRegisterSession(RegisterSession session, Instant expiresAt) {
        boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }
}
