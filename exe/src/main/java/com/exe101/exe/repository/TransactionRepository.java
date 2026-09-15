package com.exe101.exe.repository;

import com.exe101.exe.model.entity.Transaction;
import com.exe101.exe.model.enums.TransactionStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByOrderCode(String orderCode);

    boolean existsByOrderCode(String orderCode);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM Transaction t WHERE t.orderCode = :orderCode")
    Optional<Transaction> findByOrderCodeForUpdate(@Param("orderCode") String orderCode);

    List<Transaction> findByStatusAndCreatedAtBetween(TransactionStatus status, Instant from, Instant to);

    Optional<Transaction> findFirstByUserIdAndPlanAndStatusOrderByCreatedAtDesc(
            Long userId, String plan, TransactionStatus status);
}