package com.exe101.exe.service.impl;

import com.exe101.exe.dto.request.CompleteBasicProfileRequest;
import com.exe101.exe.dto.response.CloudinaryUploadResponse;
import com.exe101.exe.dto.response.ProfileCompletionResponse;
import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.mapper.UserMapper;
import com.exe101.exe.model.entity.Personality;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.enums.UserStatus;
import com.exe101.exe.repository.PersonalityRepository;
import com.exe101.exe.repository.UserRepository;
import com.exe101.exe.service.CloudinaryService;
import com.exe101.exe.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final PersonalityRepository personalityRepository;
    private final UserMapper userMapper;
    private final CloudinaryService cloudinaryService;

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
    public User findByIdWithRoles(Long id) {
        return userRepository.findByIdWithRoles(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_ID_NOT_FOUND));
    }

    @Override
    @Transactional(readOnly = true)
    public ProfileCompletionResponse getProfileCompletion(Long userId) {
        User user = findByIdWithRoles(userId);
        List<String> requiredFields = getMissingRequiredFields(user);

        return ProfileCompletionResponse.builder()
                .profileCompleted(user.isProfileCompleted())
                .required(!user.isProfileCompleted() || !requiredFields.isEmpty())
                .requiredFields(requiredFields)
                .user(userMapper.toSummary(user))
                .build();
    }

    @Override
    @Transactional
    public User completeBasicProfile(Long userId, CompleteBasicProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_ID_NOT_FOUND));

        user.setFullName(request.fullName().trim());
        user.setPhoneNumber(hasText(request.phoneNumber()) ? request.phoneNumber().trim() : null);
        user.setDateOfBirth(request.dateOfBirth());
        user.setGender(request.gender());

        if (request.personalityId() != null) {
            Personality personality = personalityRepository.findById(request.personalityId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.PERSONALITY_NOT_FOUND));
            user.setPersonality(personality);
        }

        user.setProfileCompleted(true);
        userRepository.save(user);

        return findByIdWithRoles(userId);
    }
    @Override
    @Transactional
    public User updateAvatar(Long userId, MultipartFile avatar) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_ID_NOT_FOUND));

        if (hasText(user.getAvatarPublicId())) {
            cloudinaryService.deleteImage(user.getAvatarPublicId());
        }

        CloudinaryUploadResponse uploadResult =
                cloudinaryService.uploadAvatar(avatar, "avatars/users");

        user.setAvatarUrl(uploadResult.getUrl());
        user.setAvatarPublicId(uploadResult.getPublicId());

        userRepository.save(user);

        return findByIdWithRoles(userId);
    }
    @Override
    public User save(User user) {
        return userRepository.save(user);
    }

    @Override
    public User getReferenceById(Long id) {
        return userRepository.getReferenceById(id);
    }



    private List<String> getMissingRequiredFields(User user) {
        List<String> fields = new ArrayList<>();

        if (!hasText(user.getFullName())) {
            fields.add("fullName");
        }

        return fields;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
