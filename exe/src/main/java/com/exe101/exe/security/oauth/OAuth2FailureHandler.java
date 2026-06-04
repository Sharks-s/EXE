package com.exe101.exe.security.oauth;

import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Slf4j
@Component
public class OAuth2FailureHandler implements AuthenticationFailureHandler {

    @Value("${app.oauth2.redirect-uri:http://localhost:5173/oauth2/callback}")
    private String redirectUri;

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception
    ) throws IOException {

        String errorCode = ErrorCode.OAUTH2_LOGIN_FAILED.getDefaultMessage();

        Throwable cause = exception.getCause();
        if (cause instanceof BusinessException be) {
            errorCode = be.getErrorCode().getCode();
        }

        log.warn("OAuth2 login failed: {}", errorCode);

        String targetUrl = UriComponentsBuilder
                .fromUriString(redirectUri)
                .queryParam("success", false)
                .queryParam("error", errorCode)
                .build()
                .toUriString();

        response.sendRedirect(targetUrl);
    }
}
