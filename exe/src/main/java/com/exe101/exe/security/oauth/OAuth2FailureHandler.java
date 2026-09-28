package com.exe101.exe.security.oauth;

import com.exe101.exe.config.OAuth2Properties;
import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2FailureHandler implements AuthenticationFailureHandler {

    private final OAuth2Properties oauth2Properties;

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception
    ) throws IOException {

        String errorCode = ErrorCode.OAUTH2_LOGIN_FAILED.getCode();

        Throwable cause = exception.getCause();
        if (cause instanceof BusinessException be) {
            errorCode = be.getErrorCode().getCode();
        }

        log.warn("OAuth2 login failed: {}", errorCode);

        Integer port = OAuthStateUtil.extractPort(request.getParameter("state"));

        UriComponentsBuilder builder = UriComponentsBuilder.newInstance();
        if (port != null) {
            builder.scheme("http").host("localhost").port(port).path("/");
        } else {
            builder = UriComponentsBuilder.fromUriString(oauth2Properties.getDesktopRedirectUrl());
        }

        response.sendRedirect(builder.queryParam("oauth_error", errorCode).build().toUriString());
    }
}