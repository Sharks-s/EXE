package com.exe101.exe.dto.response;

import com.exe101.exe.model.enums.PetRarity;

public record AdminPetResponse(
        Long id,
        String code,
        String name,
        String description,
        String imageUrl,
        boolean premium,
        Integer price,
        PetRarity rarity,
        boolean active
) {}
