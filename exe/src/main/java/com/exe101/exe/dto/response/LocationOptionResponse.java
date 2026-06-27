package com.exe101.exe.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LocationOptionResponse {

    private Integer code;
    private String codeName;
    private String name;
}