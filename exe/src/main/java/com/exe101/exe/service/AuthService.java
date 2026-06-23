package com.exe101.exe.service;

import com.exe101.exe.dto.request.*;
import com.exe101.exe.dto.response.*;
import com.exe101.exe.model.enums.AuthProvider;
import com.exe101.exe.security.oauth.OAuthUserPayload;

public interface AuthService {
    OAuthLoginResult processOAuthLogin(AuthProvider provider, OAuthUserPayload info);

    LoginResult login(LoginRequest loginRequest);

    RegisterResponse registerInit(RegisterInitRequest request);

    LoginResult completeRegister(CompleteRegisterRequest request);

    RefreshTokenResponse refreshToken(String refreshToken);

    void logout(String refresh);

    ExchangeResponse exchangeRefreshForAccess(String refreshToken);

    RegisterResponse forgotPassword(ForgotPasswordRequest request);

    VerifyRegisterResponse verifyOtp(VerifyRegisterRequest request);

    void resetPassword(ResetPasswordRequest request);
}
