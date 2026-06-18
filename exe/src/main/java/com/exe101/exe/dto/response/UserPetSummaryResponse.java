package com.exe101.exe.dto.response;

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
    private String imageUrl;
    private boolean premium;
    private boolean equipped;
}