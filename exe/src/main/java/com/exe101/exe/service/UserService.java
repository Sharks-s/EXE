package com.exe101.exe.service;


import com.exe101.exe.dto.request.CompleteBasicProfileRequest;
import com.exe101.exe.dto.request.ChangePasswordRequest;
import com.exe101.exe.dto.request.UpdateAiAddressRequest;
import com.exe101.exe.dto.request.UpdateUserPersonalityRequest;
import com.exe101.exe.dto.request.ChangeLanguageRequest;
import com.exe101.exe.dto.response.DailyUsageResponse;
import com.exe101.exe.dto.response.ProfileCompletionResponse;
import com.exe101.exe.model.entity.User;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

public interface UserService {
    User createLocalUser(String email);

    User activateUser(Long id);

    Optional<User> findByEmail(String email);

    User findByUsername(String username);

    User createOAuthUser(String email, String name, String avatarUrl);

    User updateOAuthUser(User user, String name, String avatarUrl);

    User findById(Long id);

    User findByIdWithRoles(Long id);

    ProfileCompletionResponse getProfileCompletion(Long userId);

    DailyUsageResponse getDailyUsage(Long userId);

    User completeBasicProfile(Long userId, CompleteBasicProfileRequest request);

    User updateAvatar(Long userId, MultipartFile avatar);

    User changePassword(Long userId, ChangePasswordRequest request);

    void deleteMyAccount(Long userId);

    User save(User user);

    User getReferenceById(Long id);
    //User createByAdmin(CreateUserByAdminRequest request);

    User updateAiAddress(Long userId, UpdateAiAddressRequest request);

    User updateUserPersonality(Long userId, UpdateUserPersonalityRequest request);

    User changeLanguage(Long userId, ChangeLanguageRequest request);
}
