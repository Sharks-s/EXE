package com.exe101.exe.dto.response;

import com.exe101.exe.model.enums.PetRarity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPetSummaryResponse {
    private Long userPetId;
    private String code;
    private String customName;
    private Integer level;
    private Integer experience;
    private String imageUrl;
    private boolean premium;
    private boolean equipped;
    private Integer price;
    private PetRarity rarity;
}
