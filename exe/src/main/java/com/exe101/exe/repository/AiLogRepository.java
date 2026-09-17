package com.exe101.exe.repository;

import com.exe101.exe.model.entity.AiLog;
import com.exe101.exe.model.enums.AiCallStatus;
import com.exe101.exe.model.enums.JsonParseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface AiLogRepository extends JpaRepository<AiLog, Long>, JpaSpecificationExecutor<AiLog> {

    long countByCreatedAtGreaterThanEqual(Instant from);

    long countByCreatedAtGreaterThanEqualAndStatus(Instant from, AiCallStatus status);

    long countByCreatedAtGreaterThanEqualAndJsonParseStatus(Instant from, JsonParseStatus status);

    @Query("""
            select l.feature, count(l)
            from AiLog l
            where l.createdAt >= :from
            group by l.feature
            order by count(l) desc
            """)
    List<Object[]> countByFeatureSince(@Param("from") Instant from);
}
