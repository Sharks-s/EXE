package com.exe101.exe.dto.response;


public record PersonalityResponse(
        Long id,
        String code,
        String name,
        String description,
        boolean isPremium
) {}