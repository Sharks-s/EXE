package com.exe101.exe.service.impl;

import com.exe101.exe.config.OtpProperties;
import com.exe101.exe.dto.request.*;
import com.exe101.exe.dto.response.*;
import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.mapper.UserMapper;
import com.exe101.exe.model.entity.*;

import com.exe101.exe.model.enums.AuthProvider;
import com.exe101.exe.model.enums.OtpType;
import com.exe101.exe.model.enums.RegisterStatus;
import com.exe101.exe.repository.RegisterSessionStore;
import com.exe101.exe.security.CustomUserDetails;
import com.exe101.exe.security.JwtTokenProvider;
import com.exe101.exe.security.MaskUtil;
import com.exe101.exe.security.oauth.OAuthUserPayload;
import com.exe101.exe.service.*;
import com.exe101.exe.service.result.TokenPair;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final AuthenticationService authenticationService;
    private final UserRoleService userRoleService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserMapper userMapper;
    private final OtpService otpService;
    private final UserService userService;
    private final RefreshTokenService refreshTokenService;
    private final OtpProperties otpProperties;
    private final MaskUtil maskUtil;
    private final UserIdentityService userIdentityService;
    private final RegisterSessionStore registerSessionStore;
    private final UserPetService userPetService;

    @Override
    @Transactional
    public OAuthLoginResult processOAuthLogin(
            AuthProvider provider,
            OAuthUserPayload payload
    ) {
        Optional<UserIdentity> identityOpt =
                userIdentityService.findByProviderAndProviderId(
                        provider,
                        payload.providerId()
                );

        User user;

        if (identityOpt.isPresent()) {
            user = identityOpt.get().getUser();

            userService.updateOAuthUser(
                    user,
                    payload.name(),
                    payload.avatar()
            );

        } else {
            user = userService.findByEmail(payload.email())
                    .orElseGet(() -> {
                        User newUser = userService.createOAuthUser(
                                payload.email(),
                                payload.name(),
                                payload.avatar()
                        );
                        userRoleService.assignRole(newUser, "USER");
                        if (!userPetService.hasAnyPet(newUser.getId())) {
                            userPetService.provisionDefaultPet(newUser);
                        }
                        return newUser;
                    });

            userIdentityService.createOAuthIdentity(
                    user,
                    provider,
                    payload.providerId()
            );
        }

        String deviceId = UUID.randomUUID().toString();

        String accessToken =
                jwtTokenProvider.generateAccessToken(user.getId());

        String refreshToken =
                jwtTokenProvider.generateRefreshToken(user.getId(), deviceId);

        refreshTokenService.create(user.getId(), refreshToken, deviceId);

        return new OAuthLoginResult(accessToken, refreshToken);
    }


    @Override
    @Transactional
    public LoginResult login(LoginRequest loginRequest) {

        Authentication authentication =
                authenticationService.authenticate(
                        loginRequest.email(),
                        loginRequest.password()
                );

        CustomUserDetails userDetails =
                (CustomUserDetails) authentication.getPrincipal();
        Long userId = userDetails.getId();

        String deviceId = UUID.randomUUID().toString();

        String accessToken =
                jwtTokenProvider.generateAccessToken(userId);

        String refreshToken =
                jwtTokenProvider.generateRefreshToken(userId, deviceId);

        refreshTokenService.create(userId, refreshToken, deviceId);

        return LoginResult.builder()
                .refreshToken(refreshToken)
                .loginResponse(LoginResponse.builder()
                        .accessToken(accessToken)
                        .user(userMapper.toSummary(userDetails.getUser()))
                        .build())
                .build();
    }

    @Override
    @Transactional
    public RegisterResponse registerInit(RegisterInitRequest request) {
        User user = userService.createLocalUser(request.email());

        if (!userRoleService.hasRole(user, "USER")) {
            userRoleService.assignRole(user, "USER");
        }

        // Chưa set password ở đây
        String verifyId = otpService.generateRegisterOtp(
                user.getId(),
                user.getEmail()
        );

        return RegisterResponse.builder()
                .email(maskUtil.maskEmail(user.getEmail()))
                .status(RegisterStatus.PENDING_VERIFY)
                .expiresInSeconds((long) otpProperties.getExpireMinutes() * 60)
                .verifyId(verifyId)
                .build();
    }

    @Override
    @Transactional
    public LoginResult completeRegister(CompleteRegisterRequest request) {
        RegisterSession session = registerSessionStore.get(request.sessionToken())
                .orElseThrow(() -> new BusinessException(ErrorCode.SESSION_EXPIRED));

        // Xóa session sau khi dùng
        registerSessionStore.delete(request.sessionToken());

        User user = userService.findById(session.getUserId());

        // Set password
        if (!userIdentityService.hasLocalIdentity(user)) {
            userIdentityService.createLocalIdentity(user, request.password());
        } else {
            userIdentityService.updateLocalPassword(user, request.password());
        }
        user.setAvatarUrl("https://res.cloudinary.com/dlkcf2b8w/image/upload/v1782566522/png-transparent-default-avatar_armtvw.png");
        // Activate user
        userService.activateUser(user.getId());

        if (!userPetService.hasAnyPet(user.getId())) {
            userPetService.provisionDefaultPet(user);
        }

        // Auto login — generate tokens giống login thường
        String deviceId = UUID.randomUUID().toString();
        String accessToken = jwtTokenProvider.generateAccessToken(user.getId());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId(), deviceId);
        refreshTokenService.create(user.getId(), refreshToken, deviceId);

        user = userService.findByIdWithRoles(user.getId());

        return LoginResult.builder()
                .refreshToken(refreshToken)
                .loginResponse(LoginResponse.builder()
                        .accessToken(accessToken)
                        .user(userMapper.toSummary(user))
                        .build())
                .build();
    }


    @Override
    @Transactional
    public RefreshTokenResponse refreshToken(String refreshToken) {

        TokenPair tokenPair = refreshTokenService.refresh(refreshToken);

        return RefreshTokenResponse.builder()
                .accessToken(tokenPair.getAccessToken())
                .refreshToken(tokenPair.getRefreshToken())
                .build();
    }

    @Override
    @Transactional
    public void logout(String refresh) {
        refreshTokenService.logout(refresh);
    }

    @Override
    public ExchangeResponse exchangeRefreshForAccess(String refreshToken) {
        RefreshToken refresh = refreshTokenService.verify(refreshToken);

        User user = userService.findByIdWithRoles(refresh.getUser().getId());

        String accessToken = jwtTokenProvider.generateAccessToken(user.getId());

        return ExchangeResponse.builder()
                .accessToken(accessToken)
                .user(userMapper.toSummary(user))
                .build();
    }

    @Override
    @Transactional
    public RegisterResponse forgotPassword(ForgotPasswordRequest request) {
        User user = userService.findByEmail(request.email())
                .orElseThrow(() -> new BusinessException(ErrorCode.EMAIL_NOT_FOUND));

        if (!userIdentityService.hasLocalIdentity(user)) {
            throw new BusinessException(ErrorCode.LOCAL_IDENTITY_NOT_FOUND);
        }

        String verifyId = otpService.generateRegisterOtp(
                user.getId(),
                user.getEmail()
        );

        return RegisterResponse.builder()
                .email(maskUtil.maskEmail(user.getEmail()))
                .expiresInSeconds((long) otpProperties.getExpireMinutes() * 60)
                .verifyId(verifyId)
                .build();
    }
    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        RegisterSession session = registerSessionStore.get(request.sessionToken())
                .orElseThrow(() -> new BusinessException(ErrorCode.SESSION_EXPIRED));

        if (session.getType() != OtpType.RESET_PASSWORD) {
            throw new BusinessException(ErrorCode.SESSION_EXPIRED);
        }

        registerSessionStore.delete(request.sessionToken());

        User user = userService.findById(session.getUserId());

        if (!userIdentityService.hasLocalIdentity(user)) {
            throw new BusinessException(ErrorCode.LOCAL_IDENTITY_NOT_FOUND);
        }

        userIdentityService.updateLocalPassword(user, request.password());
    }

    @Override
    @Transactional
    public VerifyRegisterResponse verifyOtp(VerifyRegisterRequest request) {
        OtpRedis otp = otpService.verifyRegisterOtp(
                request.verifyId(),
                request.otp()
        );

        String sessionToken = UUID.randomUUID().toString();

        registerSessionStore.save(
                sessionToken,
                RegisterSession.builder()
                        .userId(otp.getUserId())
                        .email(otp.getEmail())
                        .type(request.type())
                        .expiresAt(Instant.now().plus(10, ChronoUnit.MINUTES))
                        .build(),
                Duration.ofMinutes(10)
        );

        return VerifyRegisterResponse.builder()
                .sessionToken(sessionToken)
                .expiresInSeconds(600L)
                .build();
    }

}
