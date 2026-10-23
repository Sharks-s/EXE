package com.exe101.exe.service.impl;

import com.exe101.exe.dto.response.UserSettingResponse;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.entity.UserSetting;
import com.exe101.exe.repository.UserRepository;
import com.exe101.exe.repository.UserSettingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserSettingServiceImplTest {

    @Mock
    private UserSettingRepository userSettingRepository;

    @Mock
    private UserRepository userRepository;

    private UserSettingServiceImpl userSettingService;

    @BeforeEach
    void setUp() {
        userSettingService = new UserSettingServiceImpl(userSettingRepository, userRepository);
    }

    @Test
    void getSettingsReturnsExistingPreference() {
        UserSetting setting = UserSetting.builder().cameraEnabled(true).build();
        when(userSettingRepository.findByUserId(1L)).thenReturn(Optional.of(setting));

        UserSettingResponse response = userSettingService.getSettings(1L);

        assertTrue(response.cameraEnabled());
    }

    @Test
    void getSettingsCreatesPrivacySafeDefault() {
        User user = User.builder().id(1L).email("user@example.com").build();
        when(userSettingRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userSettingRepository.save(any(UserSetting.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        UserSettingResponse response = userSettingService.getSettings(1L);

        assertFalse(response.cameraEnabled());
        verify(userSettingRepository).save(any(UserSetting.class));
    }

    @Test
    void updateCameraEnabledPersistsPreference() {
        UserSetting setting = UserSetting.builder().cameraEnabled(false).build();
        when(userSettingRepository.findByUserId(1L)).thenReturn(Optional.of(setting));
        when(userSettingRepository.save(setting)).thenReturn(setting);

        UserSettingResponse response = userSettingService.updateCameraEnabled(1L, true);

        assertTrue(response.cameraEnabled());
        assertTrue(setting.isCameraEnabled());
        verify(userSettingRepository).save(setting);
    }
}
