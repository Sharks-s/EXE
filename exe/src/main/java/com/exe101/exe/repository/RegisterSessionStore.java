package com.exe101.exe.repository;

import com.exe101.exe.model.entity.RegisterSession;

import java.time.Duration;
import java.util.Optional;

public interface RegisterSessionStore {
    void save(String sessionToken, RegisterSession session, Duration ttl);
    Optional<RegisterSession> get(String sessionToken);
    void delete(String sessionToken);
}
