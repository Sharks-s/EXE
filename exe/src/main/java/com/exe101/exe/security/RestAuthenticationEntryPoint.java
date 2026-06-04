package com.exe101.exe.security;

import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.exception.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;

@Component
@RequiredArgsConstructor
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException
    ) throws IOException {

        ApiResponse<Void> body = ApiResponse.<Void>builder()
                .success(false)
                .code(ErrorCode.UNAUTHORIZED.getCode())
                .message(ErrorCode.UNAUTHORIZED.getDefaultMessage())
                .timestamp(Instant.now())
                .path(request.getRequestURI())
                .requestId(request.getHeader("X-Request-Id"))
                .build();

        response.setStatus(ErrorCode.UNAUTHORIZED.getHttpStatus().value());
        response.setContentType("application/json");
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
