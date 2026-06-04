package com.exe101.exe.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private boolean success;
    private String code;
    private String message;

    private T data;
    private List<ValidationError> errors;

    private Instant timestamp;
    private String path;
    private String requestId;

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .timestamp(Instant.now())
                .build();
    }

    public static ApiResponse<Void> failure(String code, String message) {
        return ApiResponse.<Void>builder()
                .success(false)
                .code(code)
                .message(message)
                .timestamp(Instant.now())
                .build();
    }
}