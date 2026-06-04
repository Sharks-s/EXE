package com.exe101.exe.repository;

import com.exe101.exe.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

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
    where u.id = :userId
""")
    Optional<User> findByIdWithRoles(Long userId);
}