package com.exe101.exe.service.impl;

import com.exe101.exe.config.AppSeedProperties;
import com.exe101.exe.dto.response.AppSettingResponse;
import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.model.entity.AppSetting;
import com.exe101.exe.model.enums.AppSettingValueType;
import com.exe101.exe.repository.AppSettingRepository;
import com.exe101.exe.service.AppSettingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AppSettingServiceImpl implements AppSettingService {

    public static final String DAILY_FREE_USAGE = "dailyFreeUsage";
    public static final String DEFAULT_CYCLE_MINUTES = "defaultCycleMinutes";
    public static final String DEFAULT_PET_CODE = "app.seed.defaultPetCode";
    public static final String DEFAULT_PERSONALITY_CODE = "app.seed.defaultPersonalityCode";

    private final AppSettingRepository appSettingRepository;
    private final AppSeedProperties appSeedProperties;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void seedDefaultSettings() {
        seed(DEFAULT_PET_CODE, appSeedProperties.getDefaultPetCode(), AppSettingValueType.STRING,
                "Default pet code assigned to new users.", "app.seed", true);
        seed(DEFAULT_PERSONALITY_CODE, appSeedProperties.getDefaultPersonalityCode(), AppSettingValueType.STRING,
                "Default personality code used when a user has none.", "app.seed", true);
        seed(DAILY_FREE_USAGE, String.valueOf(appSeedProperties.getDailyFreeUsage()), AppSettingValueType.NUMBER,
                "Daily free usage limit in minutes.", "usage", true);
        seed(DEFAULT_CYCLE_MINUTES, String.valueOf(appSeedProperties.getDefaultCycleMinutes()), AppSettingValueType.NUMBER,
                "Default focus cycle duration in minutes.", "focus", true);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppSettingResponse> getAll() {
        return appSettingRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public AppSettingResponse update(String key, String value) {
        AppSetting setting = appSettingRepository.findByKey(key)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND));
        if (!setting.isEditable()) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        validateValue(setting.getValueType(), value);
        setting.setValue(value);
        return toResponse(appSettingRepository.save(setting));
    }

    @Override
    @Transactional(readOnly = true)
    public String getString(String key, String fallback) {
        return appSettingRepository.findByKey(key)
                .map(AppSetting::getValue)
                .filter(value -> !value.isBlank())
                .orElse(fallback);
    }

    @Override
    @Transactional(readOnly = true)
    public int getInt(String key, int fallback) {
        return appSettingRepository.findByKey(key)
                .map(AppSetting::getValue)
                .map(value -> parseInt(value, fallback))
                .orElse(fallback);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean getBoolean(String key, boolean fallback) {
        return appSettingRepository.findByKey(key)
                .map(AppSetting::getValue)
                .map(Boolean::parseBoolean)
                .orElse(fallback);
    }

    private void seed(String key, String defaultValue, AppSettingValueType type, String description, String category, boolean editable) {
        if (appSettingRepository.existsByKey(key)) {
            return;
        }
        appSettingRepository.save(AppSetting.builder()
                .key(key)
                .value(defaultValue)
                .defaultValue(defaultValue)
                .valueType(type)
                .description(description)
                .category(category)
                .editable(editable)
                .build());
    }

    private void validateValue(AppSettingValueType type, String value) {
        try {
            switch (type) {
                case NUMBER -> Integer.parseInt(value);
                case BOOLEAN -> {
                    if (!"true".equalsIgnoreCase(value) && !"false".equalsIgnoreCase(value)) {
                        throw new IllegalArgumentException("Expected boolean value");
                    }
                }
                case JSON -> objectMapper.readTree(value);
                case STRING -> {
                }
            }
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED);
        }
    }

    private int parseInt(String value, int fallback) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    private AppSettingResponse toResponse(AppSetting setting) {
        return new AppSettingResponse(
                setting.getKey(),
                setting.getValue(),
                setting.getDefaultValue(),
                setting.getValueType(),
                setting.getDescription(),
                setting.getCategory(),
                setting.isEditable(),
                setting.getUpdatedAt()
        );
    }
}
