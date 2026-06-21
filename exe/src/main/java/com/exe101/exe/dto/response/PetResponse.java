package com.exe101.exe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PetResponse {
    private Long id;
    private String code;
    private String name;
    private String description;
    private String imageUrl;
    private boolean premium;
}
