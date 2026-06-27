package com.exe101.exe.service.impl;

import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.entity.UserIdentity;
import com.exe101.exe.model.enums.AuthProvider;
import com.exe101.exe.repository.UserIdentityRepository;
import com.exe101.exe.service.UserIdentityService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserIdentityServiceImpl implements UserIdentityService {

    private final UserIdentityRepository userIdentityRepository ;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    @Override
    public UserIdentity createLocalIdentity(
            User user,
            String rawPassword
    ) {
        return userIdentityRepository.save(
                UserIdentity.builder()
                        .user(user)
                        .provider(AuthProvider.LOCAL)
                        .password(passwordEncoder.encode(rawPassword))
                        .passwordUpdatedAt(Instant.now())
                        .build()
        );
    }

    @Override
    public Optional<UserIdentity> findByProviderAndProviderId(
            AuthProvider provider,
            String providerId
    ) {
        return userIdentityRepository.findByProviderAndProviderId(provider, providerId);
    }

    @Override
    public UserIdentity createOAuthIdentity(
            User user,
            AuthProvider provider,
            String providerId
    ) {
        return userIdentityRepository.save(
                UserIdentity.builder()
                        .user(user)
                        .provider(provider)
                        .providerId(providerId)
                        .password(null) // OAuth
                        .build()
        );
    }

    @Override
    public boolean hasLocalIdentity(User user) {
        return userIdentityRepository.existsByUserAndProvider(user, AuthProvider.LOCAL);
    }

    @Override
    @Transactional
    public void updateLocalPassword(User user, String rawPassword) {
        UserIdentity identity = userIdentityRepository
                .findByUserAndProvider(user, AuthProvider.LOCAL)
                .orElseThrow(() -> new BusinessException(ErrorCode.IDENTITY_NOT_FOUND));

        identity.setPassword(passwordEncoder.encode(rawPassword));
        identity.setPasswordUpdatedAt(Instant.now());
        userIdentityRepository.save(identity);
    }
    @Override
    public boolean matchesLocalPassword(User user, String rawPassword) {
        UserIdentity identity = userIdentityRepository
                .findByUserAndProvider(user, AuthProvider.LOCAL)
                .orElseThrow(() -> new BusinessException(ErrorCode.LOCAL_IDENTITY_NOT_FOUND));

        return passwordEncoder.matches(rawPassword, identity.getPassword());
    }
}
