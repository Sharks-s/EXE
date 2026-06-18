package com.exe101.exe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPetSessionResponse {
    private Long userPetId;
    private String code;        // Pet.code — Widget dùng để load asset/hình ảnh
    private String customName;  // UserPet.customName — tên user tự đặt
    private Integer level;
    private Integer experience;
    private String imageUrl;    // Pet.imageUrl — ảnh chung của loài
}