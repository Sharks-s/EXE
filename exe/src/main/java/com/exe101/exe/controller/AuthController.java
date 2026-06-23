package com.exe101.exe.controller;

import com.exe101.exe.dto.request.*;
import com.exe101.exe.dto.response.*;
import com.exe101.exe.security.CookieUtil;
import com.exe101.exe.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpHeaders;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;
    private final CookieUtil cookieUtil;

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest, HttpServletResponse response) {
        LoginResult loginResult = authService.login(loginRequest);
        response.addHeader(HttpHeaders.SET_COOKIE,cookieUtil.createRefreshCookie(loginResult.getRefreshToken()).toString());
        return ApiResponse.success(loginResult.getLoginResponse());
    }

    @PostMapping("/register/init")
    public ApiResponse<RegisterResponse> registerInit(
            @Valid @RequestBody RegisterInitRequest request
    ) {
        return ApiResponse.success(authService.registerInit(request));
    }

    @PostMapping("/verify")
    public ApiResponse<VerifyRegisterResponse> verify(
            @Valid @RequestBody VerifyRegisterRequest request
    ) {
        return ApiResponse.success(authService.verifyOtp(request));
    }

    @PostMapping("/register/complete")
    public ApiResponse<LoginResponse> completeRegister(
            @Valid @RequestBody CompleteRegisterRequest request,
            HttpServletResponse response
    ) {
        LoginResult result = authService.completeRegister(request);
        response.addHeader(
                HttpHeaders.SET_COOKIE,
                cookieUtil.createRefreshCookie(result.getRefreshToken()).toString()
        );
        return ApiResponse.success(result.getLoginResponse());
    }

    @PostMapping("/refresh")
    public ApiResponse<RefreshTokenResponse> refreshToken(
            @CookieValue(value = "refresh_token", required = false) String refreshToken,
            HttpServletResponse response
    ) {
        RefreshTokenResponse refreshResp = authService.refreshToken(refreshToken);

        response.addHeader(
                HttpHeaders.SET_COOKIE,
                cookieUtil.createRefreshCookie(refreshResp.getRefreshToken()).toString()
        );
        return ApiResponse.success(refreshResp);
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(
            @CookieValue(value = "refresh_token", required = false) String refreshToken,
            HttpServletResponse response
    ) {
        authService.logout(refreshToken);

        ResponseCookie clear = cookieUtil.clearRefreshCookie();
        response.addHeader(HttpHeaders.SET_COOKIE, clear.toString());

        return ApiResponse.success(null);
    }


    @PostMapping("/exchange")
    public ApiResponse<ExchangeResponse> exchange(
            @CookieValue(value = "refresh_token", required = false) String refreshToken
    ) {
        ExchangeResponse exchangeResponse =
                authService.exchangeRefreshForAccess(refreshToken);

        return ApiResponse.success(exchangeResponse);
    }

    @PostMapping("/password/forgot")
    public ApiResponse<RegisterResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {
        return ApiResponse.success(authService.forgotPassword(request));
    }

    @PostMapping("/password/reset")
    public ApiResponse<Void> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        authService.resetPassword(request);
        return ApiResponse.success(null);
    }
}