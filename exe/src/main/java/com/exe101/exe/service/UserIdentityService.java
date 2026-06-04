package com.exe101.exe.service;

import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.entity.UserIdentity;
import com.exe101.exe.model.enums.AuthProvider;

import java.util.Optional;

public interface UserIdentityService {
    UserIdentity createLocalIdentity(User user, String rawPassword
    );

    Optional<UserIdentity> findByProviderAndProviderId(AuthProvider provider, String providerId);

    UserIdentity createOAuthIdentity(User user, AuthProvider provider, String providerId);

    boolean hasLocalIdentity(User user);

    void updateLocalPassword(User user, String rawPassword);
}