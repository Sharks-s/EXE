package com.exe101.exe.dto.response;

import com.exe101.exe.model.enums.AppSettingValueType;

import java.time.Instant;

public record AppSettingResponse(
        String key,
        String value,
        String defaultValue,
        AppSettingValueType valueType,
        String description,
        String category,
        boolean editable,
        Instant updatedAt
) {
}
