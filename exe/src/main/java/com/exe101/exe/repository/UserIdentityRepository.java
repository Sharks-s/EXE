package com.exe101.exe.repository;


import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.entity.UserIdentity;
import com.exe101.exe.model.enums.AuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface UserIdentityRepository extends JpaRepository<UserIdentity, Long> {
    Optional<UserIdentity> findByProviderAndProviderId(AuthProvider provider, String providerId);

    Optional<UserIdentity> findByUserAndProvider(User user, AuthProvider provider);

    @Query("""
        select ui
        from UserIdentity ui
        where ui.user.id = :userId
          and ui.provider = 'LOCAL'
    """)
    Optional<UserIdentity> findLocalIdentityByUserId(Long userId);

    Optional<UserIdentity> findFirstByUserId(Long userId);

    boolean existsByUserAndProvider(User user, AuthProvider provider);
}