package com.exe101.exe.service.impl;

import com.exe101.exe.config.AppSeedProperties;
import com.exe101.exe.dto.request.ChangePasswordRequest;
import com.exe101.exe.dto.request.CompleteBasicProfileRequest;
import com.exe101.exe.dto.request.UpdateAiAddressRequest;
import com.exe101.exe.dto.response.CloudinaryUploadResponse;
import com.exe101.exe.dto.response.DailyUsageResponse;
import com.exe101.exe.dto.response.ProfileCompletionResponse;
import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.mapper.UserMapper;
import com.exe101.exe.model.entity.Personality;
import com.exe101.exe.model.entity.Province;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.entity.Ward;
import com.exe101.exe.model.enums.UserStatus;
import com.exe101.exe.repository.PersonalityRepository;
import com.exe101.exe.repository.ProvinceRepository;
import com.exe101.exe.repository.RefreshTokenRepository;
import com.exe101.exe.repository.UserIdentityRepository;
import com.exe101.exe.repository.UserRepository;
import com.exe101.exe.repository.WardRepository;
import com.exe101.exe.service.ImageService;
import com.exe101.exe.service.UserIdentityService;
import com.exe101.exe.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final UserRepository userRepository;
    private final PersonalityRepository personalityRepository;
    private final ProvinceRepository provinceRepository;
    private final WardRepository wardRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserIdentityRepository userIdentityRepository;
    private final UserMapper userMapper;
    private final ImageService cloudinaryService;
    private final UserIdentityService userIdentityService;
    private final AppSeedProperties appSeedProperties;

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
    public DailyUsageResponse getDailyUsage(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_ID_NOT_FOUND));

        resetDailyUsageIfNeeded(user, Instant.now());

        int dailyUsedMinutes = currentDailyUsedMinutes(user);
        int dailyLimitMinutes = appSeedProperties.getDailyFreeUsage();

        return DailyUsageResponse.builder()
                .dailyUsedMinute(dailyUsedMinutes)
                .dailyLimitMinute(dailyLimitMinutes)
                .remainingMinute(Math.max(0, dailyLimitMinutes - dailyUsedMinutes))
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
        user.setAddressLine(hasText(request.addressLine()) ? request.addressLine().trim() : null);

        Province province = null;
        if (request.provinceCode() != null) {
            province = provinceRepository.findById(request.provinceCode())
                    .orElseThrow(() -> new BusinessException(ErrorCode.PROVINCE_NOT_FOUND));
        }

        Ward ward = null;
        if (request.wardCode() != null) {
            ward = wardRepository.findById(request.wardCode())
                    .orElseThrow(() -> new BusinessException(ErrorCode.WARD_NOT_FOUND));

            if (province != null && !ward.getProvince().getCode().equals(province.getCode())) {
                throw new BusinessException(ErrorCode.INVALID_ADDRESS);
            }

            if (province == null) {
                province = ward.getProvince();
            }
        }

        user.setProvince(province);
        user.setWard(ward);

        if (request.personalityId() != null) {
            Personality personality = personalityRepository.findById(request.personalityId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.PERSONALITY_NOT_FOUND));
            user.setPersonality(personality);
        }

        user.setProfileCompleted(getMissingRequiredFields(user).isEmpty());
        userRepository.save(user);

        return findByIdWithRoles(userId);
    }

    @Override
    @Transactional
    public User changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_ID_NOT_FOUND));

        if (!userIdentityService.hasLocalIdentity(user)) {
            throw new BusinessException(ErrorCode.LOCAL_IDENTITY_NOT_FOUND);
        }

        if (!userIdentityService.matchesLocalPassword(user, request.oldPassword())) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        userIdentityService.updateLocalPassword(user, request.newPassword());

        return findByIdWithRoles(userId);
    }

    @Override
    @Transactional
    public void deleteMyAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_ID_NOT_FOUND));

        if (hasText(user.getAvatarPublicId())) {
            cloudinaryService.deleteImage(user.getAvatarPublicId());
        }

        refreshTokenRepository.revokeAllByUserId(userId);
        userIdentityRepository.deleteAllByUserId(userId);

        user.setStatus(UserStatus.DEACTIVATED);
        user.setEmail(buildDeletedEmail(userId));
        user.setFullName("Deleted User");
        user.setAvatarUrl(null);
        user.setAvatarPublicId(null);
        user.setProfileCompleted(false);
        user.setPhoneNumber(null);
        user.setGender(null);
        user.setDateOfBirth(null);
        user.setAddressLine(null);
        user.setProvince(null);
        user.setWard(null);
        user.setPersonality(null);

        userRepository.save(user);
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

    @Override
    @Transactional
    public User updateAiAddress(Long userId, UpdateAiAddressRequest request) {
        User user = findById(userId);

        user.setAiSelfAddress(
                (request.aiSelfAddress() != null && !request.aiSelfAddress().isBlank())
                        ? request.aiSelfAddress().trim() : null
        );
        user.setAiUserAddress(
                (request.aiUserAddress() != null && !request.aiUserAddress().isBlank())
                        ? request.aiUserAddress().trim() : null
        );

        userRepository.save(user);
        return findByIdWithRoles(userId);
    }


    // HELPER
    private List<String> getMissingRequiredFields(User user) {
        List<String> fields = new ArrayList<>();

        if (!hasText(user.getFullName())) {
            fields.add("fullName");
        }

        if (!hasText(user.getAddressLine())) {
            fields.add("addressLine");
        }

        if (user.getProvince() == null) {
            fields.add("provinceCode");
        }

        if (user.getWard() == null) {
            fields.add("wardCode");
        }

        return fields;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private void resetDailyUsageIfNeeded(User user, Instant now) {
        LocalDate today = now.atZone(VN_ZONE).toLocalDate();
        LocalDate lastUsageLocalDate = user.getLastUsageDate() != null
                ? user.getLastUsageDate().atZone(VN_ZONE).toLocalDate()
                : null;

        if (lastUsageLocalDate == null || !lastUsageLocalDate.isEqual(today)) {
            user.setDailyUsedMinutes(0);
            user.setLastUsageDate(now);
            userRepository.save(user);
        }
    }

    private int currentDailyUsedMinutes(User user) {
        return user.getDailyUsedMinutes() != null ? user.getDailyUsedMinutes() : 0;
    }

    private String buildDeletedEmail(Long userId) {
        return "deleted_" + userId + "_" + Instant.now().toEpochMilli() + "@deleted.local";
    }
}
