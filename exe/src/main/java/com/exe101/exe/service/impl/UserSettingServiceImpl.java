package com.exe101.exe.service.impl;

import com.exe101.exe.dto.response.UserSettingResponse;
import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.entity.UserSetting;
import com.exe101.exe.repository.UserRepository;
import com.exe101.exe.repository.UserSettingRepository;
import com.exe101.exe.service.UserSettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserSettingServiceImpl implements UserSettingService {
    private final UserSettingRepository userSettingRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public UserSettingResponse getSettings(Long userId) {
        return toResponse(getOrCreate(userId));
    }

    @Override
    @Transactional
    public UserSettingResponse updateCameraEnabled(Long userId, boolean cameraEnabled) {
        UserSetting setting = getOrCreate(userId);
        setting.setCameraEnabled(cameraEnabled);
        return toResponse(userSettingRepository.save(setting));
    }

    private UserSetting getOrCreate(Long userId) {
        return userSettingRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new BusinessException(ErrorCode.USER_ID_NOT_FOUND));
                    UserSetting setting = UserSetting.builder()
                            .user(user)
                            .cameraEnabled(false)
                            .build();
                    user.setUserSetting(setting);
                    return userSettingRepository.save(setting);
                });
    }

    private UserSettingResponse toResponse(UserSetting setting) {
        return new UserSettingResponse(setting.isCameraEnabled());
    }
}
