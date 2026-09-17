package com.exe101.exe.service;

import com.exe101.exe.dto.response.AppSettingResponse;

import java.util.List;

public interface AppSettingService {
    void seedDefaultSettings();
    List<AppSettingResponse> getAll();
    AppSettingResponse update(String key, String value);
    String getString(String key, String fallback);
    int getInt(String key, int fallback);
    boolean getBoolean(String key, boolean fallback);
}
