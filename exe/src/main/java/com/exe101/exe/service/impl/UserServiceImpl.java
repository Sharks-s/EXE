package com.exe101.exe.service.impl;

import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.enums.UserStatus;
import com.exe101.exe.repository.UserRepository;
import com.exe101.exe.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;

    @Override
    public User createLocalUser(String email) {
        Optional<User> existing = userRepository.findByEmail(email);

        if (existing.isPresent()) {
            User user = existing.get();

            if (user.getStatus() == UserStatus.ACTIVE) {
                throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
            }

            if (user.getStatus() == UserStatus.PENDING) {
                return user;
            }
        }

        User user = User.builder()
                .email(email)
                .fullName(null)
                .status(UserStatus.PENDING)
                .profileCompleted(false)
                .lastLoginAt(null)
                .build();

        return userRepository.save(user);
    }

    @Override
    @Transactional
    public User activateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (user.getStatus() == UserStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.USER_ALREADY_ACTIVE);
        }

        user.setStatus(UserStatus.ACTIVE);

        return userRepository.save(user);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public User findByUsername(String username) {
        return null;
    }

    @Override
    @Transactional
    public User createOAuthUser(String email, String name, String avatarUrl) {
        return userRepository.save(
                User.builder()
                        .email(email)
                        .fullName(name)
                        .avatarUrl(avatarUrl)
                        .status(UserStatus.ACTIVE)
                        .profileCompleted(true)
                        .lastLoginAt(Instant.now())
                        .build()
        );
    }

    @Override
    @Transactional
    public User updateOAuthUser(User user, String name, String avatarUrl) {

        if ((user.getFullName() == null || user.getFullName().isBlank())
                && name != null && !name.isBlank()) {
            user.setFullName(name);
        }

        if ((user.getAvatarUrl() == null || user.getAvatarUrl().isBlank())
                && avatarUrl != null && !avatarUrl.isBlank()) {
            user.setAvatarUrl(avatarUrl);
        }

        user.setLastLoginAt(Instant.now());

        return user;
    }

    @Override
    public User findById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new BusinessException(ErrorCode.USER_ID_NOT_FOUND));
    }

    @Override
    public User getReferenceById(Long id) {
        return userRepository.getReferenceById(id);
    }


}