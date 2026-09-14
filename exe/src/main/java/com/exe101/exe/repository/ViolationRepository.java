package com.exe101.exe.repository;

import com.exe101.exe.dto.response.AdminViolationStatsResponse;
import com.exe101.exe.model.entity.Violation;
import com.exe101.exe.model.enums.ViolationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface ViolationRepository extends JpaRepository<Violation, Long> {
    List<Violation> findBySessionUserIdAndOccurredAtGreaterThanEqualAndOccurredAtLessThan(
            Long userId,
            Instant from,
            Instant to
    );

    @Query("""
        select new com.exe101.exe.dto.response.AdminViolationStatsResponse$TopViolator(
            s.user.id, s.user.email, s.user.fullName, count(v)
        )
        from Violation v join v.session s
        where v.occurredAt >= :from
        group by s.user.id, s.user.email, s.user.fullName
        order by count(v) desc
        """)
    List<AdminViolationStatsResponse.TopViolator> findTopViolators(@Param("from") Instant from, Pageable pageable);

    @Query("""
        select new com.exe101.exe.dto.response.AdminViolationStatsResponse$TopApp(
            v.appName, count(v)
        )
        from Violation v
        where v.occurredAt >= :from and v.appName is not null
        group by v.appName
        order by count(v) desc
        """)
    List<AdminViolationStatsResponse.TopApp> findTopViolatedApps(@Param("from") Instant from, Pageable pageable);

    @Query("""
        select new com.exe101.exe.dto.response.AdminViolationStatsResponse$TypeCount(
            v.type, count(v)
        )
        from Violation v
        where v.occurredAt >= :from
        group by v.type
        order by count(v) desc
        """)
    List<AdminViolationStatsResponse.TypeCount> countByTypeSince(@Param("from") Instant from);

    // --- Tra cứu chi tiết có filter, phân trang ---

    @Query("""
        select v from Violation v
        join fetch v.session s
        join fetch s.user u
        where (:userId is null or u.id = :userId)
        and (:type is null or v.type = :type)
        and (:from is null or v.occurredAt >= :from)
        and (:to is null or v.occurredAt < :to)
        order by v.occurredAt desc
        """)
    Page<Violation> searchViolations(
            @Param("userId") Long userId,
            @Param("type") ViolationType type,
            @Param("from") Instant from,
            @Param("to") Instant to,
            Pageable pageable
    );
}
