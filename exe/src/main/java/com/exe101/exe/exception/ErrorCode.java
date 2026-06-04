package com.exe101.exe.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // ===== VALIDATION =====
    VALIDATION_FAILED("VAL_001", HttpStatus.BAD_REQUEST, "Validation failed"),

    // ===== BUSINESS =====
    RESOURCE_NOT_FOUND("BUS_001", HttpStatus.NOT_FOUND, "Resource not found"),
    DUPLICATE_RESOURCE("BUS_002", HttpStatus.CONFLICT, "Duplicate resource"),
    BUSINESS_ERROR("BUS_003", HttpStatus.BAD_REQUEST, "Business error"),

    // ===== SECURITY =====
    UNAUTHORIZED("SEC_001", HttpStatus.UNAUTHORIZED, "Unauthorized"),
    FORBIDDEN("SEC_002", HttpStatus.FORBIDDEN, "Access denied"),
    LOCKED("SEC_003", HttpStatus.LOCKED, "Locked"),

    // ===== SYSTEM =====
    INTERNAL_ERROR("SYS_001", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error"),
    EXTERNAL_SERVICE_ERROR("SYS_002", HttpStatus.BAD_GATEWAY, "External service error"),

    // ===== USER =====
    USER_NOT_FOUND("USER_001", HttpStatus.NOT_FOUND, "User not found"),
    USER_ALREADY_ACTIVE("USER_002", HttpStatus.BAD_REQUEST, "User already active"),
    USER_ID_NOT_FOUND("USER_003", HttpStatus.NOT_FOUND, "User id not found"),

    // ===== AUTH =====
    EMAIL_ALREADY_EXISTS("AUTH_001", HttpStatus.CONFLICT, "Email already exists"),
    REGISTER_PENDING_VERIFY("AUTH_002", HttpStatus.CREATED, "Please verify your email"),
    ACCOUNT_NOT_ACTIVE("AUTH_003", HttpStatus.FORBIDDEN, "Account is not active"),
    INVALID_OTP("AUTH_004", HttpStatus.BAD_REQUEST, "Invalid verification code"),
    OTP_EXPIRED("AUTH_005", HttpStatus.BAD_REQUEST, "Verification code expired"),
    OTP_ALREADY_USED("AUTH_006", HttpStatus.BAD_REQUEST, "Verification code already used"),
    INVALID_CREDENTIALS("AUTH_007", HttpStatus.UNAUTHORIZED, "Invalid email or password"),
    OTP_MAX_ATTEMPTS_EXCEEDED("AUTH_008", HttpStatus.BAD_REQUEST, "Too many OTP attempts"),
    REFRESH_TOKEN_USED("AUTH_009", HttpStatus.UNAUTHORIZED, "Refresh token used"),
    REFRESH_TOKEN_EXPIRED("AUTH_010", HttpStatus.BAD_REQUEST, "Refresh token expired"),
    REFRESH_TOKEN_REVOKED("AUTH_011", HttpStatus.BAD_REQUEST, "Refresh token revoked"),
    REFRESH_TOKEN_INVALID("AUTH_012", HttpStatus.BAD_REQUEST, "Invalid refresh token"),
    REFRESH_TOKEN_NOT_FOUND("AUTH_013", HttpStatus.BAD_REQUEST, "Refresh token not found"),
    EMAIL_NOT_FOUND("AUTH_014", HttpStatus.NOT_FOUND, "Email not found"),
    EMAIL_NOT_FOUND_OAUTH2("AUTH_015", HttpStatus.NOT_FOUND, "Email not found from Oauth2 provider"),
    OAUTH2_AUTH_FAILED("AUTH_016", HttpStatus.UNAUTHORIZED, "OAuth2 authentication failed"),
    OAUTH2_PROVIDER_NOT_SUPPORTED("AUTH_017", HttpStatus.UNAUTHORIZED, "OAuth2 provider not supported"),
    OAUTH2_LOGIN_FAILED("AUTH_018", HttpStatus.UNAUTHORIZED, "OAuth2 login failed"),
    OAUTH2_MISSING_PROVIDER_ID("AUTH_019", HttpStatus.UNAUTHORIZED, "OAuth2 provider id missing"),
    OAUTH2_EMAIL_NOT_FOUND("AUTH_020", HttpStatus.NOT_FOUND, "Email not found"),
    OAUTH2_INVALID_USER_INFO("AUTH_021", HttpStatus.BAD_REQUEST, "Invalid user info"),

    INVALID_EMAIL_OR_PASSWORD("AUTH_022", HttpStatus.BAD_REQUEST, "Invalid email or password"),
    LOCAL_IDENTITY_NOT_FOUND("AUTH_023", HttpStatus.NOT_FOUND, "Local identity not found"),
    ROLE_NOT_FOUND("AUTH_024", HttpStatus.NOT_FOUND, "Role not found"),
    OTP_BLOCKED("AUTH_025", HttpStatus.FORBIDDEN, "Otp blocked"),
    OTP_NOT_FOUND("AUTH_026", HttpStatus.NOT_FOUND, "Otp not found"),
    REFRESH_TOKEN_MISSING("AUTH_027", HttpStatus.UNAUTHORIZED, "Refresh token missing"),
    IDENTITY_NOT_FOUND("AUTH_028", HttpStatus.NOT_FOUND, "Identity not found"),
    REFRESH_TOKEN_REUSED("AUTH_029", HttpStatus.UNAUTHORIZED, "Refresh token reused"),
    SESSION_EXPIRED("AUTH_030", HttpStatus.UNAUTHORIZED, "Session expired")
    ;


    private final String code;
    private final HttpStatus httpStatus;
    private final String defaultMessage;

    ErrorCode(String code, HttpStatus httpStatus, String defaultMessage) {
        this.code = code;
        this.httpStatus = httpStatus;
        this.defaultMessage = defaultMessage;
    }
}
