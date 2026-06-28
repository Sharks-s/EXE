package com.exe101.exe.dto.response;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

public class ProvinceApiResponse {

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProvinceDto {

        private Integer code;

        private String name;

        @JsonProperty("code_name")
        @JsonAlias("codename")
        private String codeName;

        private List<WardDto> wards;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WardDto {

        private Integer code;

        private String name;

        @JsonProperty("code_name")
        @JsonAlias("codename")
        private String codeName;
    }
}
