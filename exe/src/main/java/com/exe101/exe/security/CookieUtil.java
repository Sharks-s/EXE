package com.exe101.exe.security;


import com.exe101.exe.config.AuthCookieProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CookieUtil {
    private final AuthCookieProperties props;

    public ResponseCookie createRefreshCookie(String token) {
        return ResponseCookie.from("refresh_token", token)
                .httpOnly(true)
                .secure(props.isSecure())
                .sameSite(props.getSameSite())
                .path("/")
                .maxAge(props.getRefreshMaxAge())
                .build();
    }

    public ResponseCookie clearRefreshCookie() {
        return ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(props.isSecure())
                .sameSite(props.getSameSite())
                .path("/")
                .maxAge(0)
                .build();
    }
}
