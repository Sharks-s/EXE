package com.exe101.exe.security;

import com.exe101.exe.dto.response.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.exe101.exe.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;

@Component
@RequiredArgsConstructor
public class RestAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException accessDeniedException
    ) throws IOException {

        ApiResponse<Void> body = ApiResponse.<Void>builder()
                .success(false)
                .code(ErrorCode.FORBIDDEN.getCode())
                .message(ErrorCode.FORBIDDEN.getDefaultMessage())
                .timestamp(Instant.now())
                .path(request.getRequestURI())
                .requestId(request.getHeader("X-Request-Id"))
                .build();

        response.setStatus(ErrorCode.FORBIDDEN.getHttpStatus().value());
        response.setContentType("application/json");
        response.getWriter().write(
                objectMapper.writeValueAsString(body)
        );
    }
}

