package com.exe101.exe.repository;

import com.exe101.exe.model.entity.RefreshToken;
import com.exe101.exe.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);

    void deleteAllByUserId(Long userId);

    Optional<RefreshToken> findLatestByDeviceId(String deviceId);

    @Modifying
    @Query("update RefreshToken r set r.revoked = true where r.deviceId = :deviceId")
    void revokeAllByDeviceId(String deviceId);
}