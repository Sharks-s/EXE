package com.exe101.exe.repository;

import com.exe101.exe.model.entity.Subscription;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Set;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    boolean existsByUserIdAndIsActiveTrue(Long userId);
    boolean existsByUserIdAndPlanIgnoreCase(Long userId, String plan);
    List<Subscription> findByUserIdAndIsActiveTrue(Long userId);

    @Query("""
            select count(s) > 0
            from Subscription s
            where s.user.id = :userId
              and s.isActive = true
              and upper(s.plan) in ('PRO', 'PREMIUM')
              and (s.expiresAt is null or s.expiresAt > :now)
            """)
    boolean hasActiveProAccess(@Param("userId") Long userId, @Param("now") Instant now);

    @Query("""
            SELECT s.user.id
            FROM Subscription s
            WHERE s.user.id IN :userIds
              AND s.isActive = true
              AND upper(s.plan) in ('PRO', 'PREMIUM')
              AND (s.expiresAt is null or s.expiresAt > :now)
            """)
    Set<Long> findActivePremiumUserIds(@Param("userIds") List<Long> userIds, @Param("now") Instant now);

    @Query("""
            SELECT s
            FROM Subscription s
            WHERE s.user.id = :userId
              AND s.isActive = true
              AND upper(s.plan) in ('PRO', 'PREMIUM')
              AND (s.expiresAt is null or s.expiresAt > :now)
            ORDER BY s.expiresAt DESC
            """)
    List<Subscription> findActivePremiumByUserId(@Param("userId") Long userId, @Param("now") Instant now);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Subscription s WHERE s.user.id = :userId AND s.isActive = true ORDER BY s.expiresAt DESC")
    List<Subscription> findActiveByUserIdForUpdate(@Param("userId") Long userId);

    @Query("""
            select count(s)
            from Subscription s
            where s.isActive = true
              and upper(s.plan) in ('PRO', 'PREMIUM')
              and (s.expiresAt is null or s.expiresAt > :now)
            """)
    long countActivePremium(@Param("now") Instant now);

    @Query("""
            select count(s)
            from Subscription s
            where s.isActive = true
              and upper(s.plan) in ('PRO', 'PREMIUM')
              and upper(coalesce(s.billingCycle, '')) = upper(:billingCycle)
              and (s.expiresAt is null or s.expiresAt > :now)
            """)
    long countActivePremiumByBillingCycle(@Param("billingCycle") String billingCycle, @Param("now") Instant now);

    @Query(
            value = """
                    select s
                    from Subscription s
                    join fetch s.user u
                    where s.isActive = true
                      and upper(s.plan) in ('PRO', 'PREMIUM')
                      and (s.expiresAt is null or s.expiresAt > :now)
                      and (:keyword is null or :keyword = ''
                           or lower(u.email) like lower(concat('%', :keyword, '%'))
                           or lower(coalesce(u.fullName, '')) like lower(concat('%', :keyword, '%'))
                           or lower(s.plan) like lower(concat('%', :keyword, '%')))
                    """,
            countQuery = """
                    select count(s)
                    from Subscription s
                    join s.user u
                    where s.isActive = true
                      and upper(s.plan) in ('PRO', 'PREMIUM')
                      and (s.expiresAt is null or s.expiresAt > :now)
                      and (:keyword is null or :keyword = ''
                           or lower(u.email) like lower(concat('%', :keyword, '%'))
                           or lower(coalesce(u.fullName, '')) like lower(concat('%', :keyword, '%'))
                           or lower(s.plan) like lower(concat('%', :keyword, '%')))
                    """
    )
    Page<Subscription> searchActiveSubscriptions(
            @Param("keyword") String keyword,
            @Param("now") Instant now,
            Pageable pageable
    );
}
