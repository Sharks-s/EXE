package com.exe101.exe.service.impl;

import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.entity.UserIdentity;
import com.exe101.exe.repository.UserIdentityRepository;
import com.exe101.exe.repository.UserRepository;
import com.exe101.exe.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserIdentityRepository userIdentityRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) {

        log.debug("Authenticating user by email: {}", email);

        User user = userRepository.findByEmailWithRolesAndPersonality(email)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.INVALID_EMAIL_OR_PASSWORD)
                );

        UserIdentity identity = userIdentityRepository
                .findLocalIdentityByUserId(user.getId())
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.LOCAL_IDENTITY_NOT_FOUND)
                );

        return new CustomUserDetails(user, identity);
    }

    @Transactional(readOnly = true)
    public UserDetails loadUserById(Long userId) {

        User user = userRepository.findByIdWithRoles(userId)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.USER_NOT_FOUND)
                );

        UserIdentity identity = userIdentityRepository
                .findFirstByUserId(userId)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.IDENTITY_NOT_FOUND)
                );

        return new CustomUserDetails(user, identity);
    }
}
