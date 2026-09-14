package com.exe101.exe.dto.response;

public record AdminPetResponse(
        Long id,
        String code,
        String name,
        String description,
        String imageUrl,
        boolean premium
) {}