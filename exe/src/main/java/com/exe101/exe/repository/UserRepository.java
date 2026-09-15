package com.exe101.exe.repository;

import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import java.util.Optional;


@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);

    @Query("""
    select u
    from User u
    left join fetch u.userRoles ur
    left join fetch ur.role
    left join fetch u.personality
    left join fetch u.province
    left join fetch u.ward
    left join fetch u.identities
    where u.email = :email
""")
    Optional<User> findByEmailWithRolesAndPersonality(String email);

    @Query("""
    select u
    from User u
    left join fetch u.userRoles ur
    left join fetch ur.role
    left join fetch u.personality
    left join fetch u.province
    left join fetch u.ward
    left join fetch u.identities
    where u.id = :userId
""")
    Optional<User> findByIdWithRoles(Long userId);

    // ===== ADMIN =====
    @Query("""
        select u from User u
        where (:status is null or u.status = :status)
        and (:keyword is null or :keyword = ''
             or lower(u.email) like lower(concat('%', :keyword, '%'))
             or lower(u.fullName) like lower(concat('%', :keyword, '%')))
        """)
    Page<User> searchUsers(
            @Param("keyword") String keyword,
            @Param("status") UserStatus status,
            Pageable pageable
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> findByIdForUpdate(@Param("id") Long id);
}
