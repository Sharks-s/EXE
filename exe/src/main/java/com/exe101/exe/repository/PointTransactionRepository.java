package com.exe101.exe.repository;

import com.exe101.exe.model.entity.PointTransaction;
import com.exe101.exe.model.enums.PointTransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PointTransactionRepository extends JpaRepository<PointTransaction, Long> {
    boolean existsByUserIdAndReferenceIdAndType(Long userId, String referenceId, PointTransactionType type);

    Page<PointTransaction> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
