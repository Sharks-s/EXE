package com.exe101.exe.repository;

import com.exe101.exe.model.entity.PointWallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PointWalletRepository extends JpaRepository<PointWallet, Long> {
    Optional<PointWallet> findByUserId(Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM PointWallet w WHERE w.user.id = :userId")
    Optional<PointWallet> findByUserIdForUpdate(@Param("userId") Long userId);
}
