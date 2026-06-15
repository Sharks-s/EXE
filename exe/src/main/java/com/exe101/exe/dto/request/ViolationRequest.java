package com.exe101.exe.dto.request;

import com.exe101.exe.model.enums.ViolationType;

public record ViolationRequest(
        ViolationType type,
        String appName,
        String windowTitle
) {}