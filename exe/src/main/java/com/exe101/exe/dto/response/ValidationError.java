package com.exe101.exe.dto.response;

import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ValidationError {
    private String field;
    private String message;
    private String annotation;
    private Map<String, Object> params;
}
