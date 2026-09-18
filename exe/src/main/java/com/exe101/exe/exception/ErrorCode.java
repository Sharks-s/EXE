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
    SESSION_EXPIRED("AUTH_030", HttpStatus.UNAUTHORIZED, "Session expired"),

    // ===== PERSONALITY =====
    PERSONALITY_NOT_FOUND("PERSONALITY_001", HttpStatus.NOT_FOUND, "Personality not found"),
    PERSONALITY_CODE_ALREADY_EXISTS("PERSONALITY_002", HttpStatus.CONFLICT, "Personality code already exists"),
    PERSONALITY_DES_NOT_FOUND("PERSONALITY_003", HttpStatus.NOT_FOUND, "Personality description not found"),

    // ===== LOCATION =====
    PROVINCE_NOT_FOUND("LOCATION_001", HttpStatus.NOT_FOUND, "Province not found"),
    WARD_NOT_FOUND("LOCATION_002", HttpStatus.NOT_FOUND, "Ward not found"),
    INVALID_ADDRESS("LOCATION_003", HttpStatus.BAD_REQUEST, "Invalid address"),

    // ===== FOCUS SESSION =====
    SESSION_NOT_FOUND("SESSION_001", HttpStatus.NOT_FOUND, "Session not found"),
    SESSION_ALREADY_ENDED("SESSION_002", HttpStatus.BAD_REQUEST, "Session already ended"),
    SESSION_ALREADY_RUNNING("SESSION_003", HttpStatus.BAD_REQUEST, "Session already running"),
    SESSION_UNAUTHORIZED_ACCESS("SESSION_004", HttpStatus.FORBIDDEN, "Unauthorized access to session"),
    SESSION_NOT_IN_PROGRESS("SESSION_005", HttpStatus.BAD_REQUEST, "Session not in progress"),
    SESSION_CYCLE_NOT_COMPLETED_YET("SESSION_006", HttpStatus.BAD_REQUEST, "Session cycle not completed yet"),
    SESSION_ALREADY_PAUSED("SESSION_007", HttpStatus.BAD_REQUEST, "Session already paused"),
    SESSION_NOT_PAUSED("SESSION_008", HttpStatus.BAD_REQUEST, "Session is not paused"),
    NO_BREAK_TIME_AVAILABLE("SESSION_009", HttpStatus.BAD_REQUEST, "No break time available"),
    SESSION_STARTED_TOO_SOON("SESSION_010", HttpStatus.CONFLICT, "Please wait before starting another focus session"),
    // ===== PREMIUM =====
    DAILY_LIMIT_EXCEEDED("PREMIUM_001", HttpStatus.BAD_REQUEST, "Daily limit exceeded"),

    // ===== PET =====
    DEFAULT_PET_NOT_FOUND("PET_001", HttpStatus.NOT_FOUND, "Default pet not found"),

    DEFAULT_PET_NOT_CONFIGURED("PET_003", HttpStatus.INTERNAL_SERVER_ERROR, "Default pet not configured"),
    USER_PET_PROVISION_FAILED("PET_004", HttpStatus.INTERNAL_SERVER_ERROR, "Failed to provision default pet for user"),
    USER_PET_NOT_FOUND("PET_005", HttpStatus.NOT_FOUND, "User pet not found"),
    PET_NOT_FOUND("PET_006", HttpStatus.NOT_FOUND, "Pet not found"),
    USER_PET_ALREADY_EXISTS("PET_007", HttpStatus.CONFLICT, "User already owns this pet"),

    // ===== POINTS =====
    INVALID_POINT_AMOUNT("POINT_001", HttpStatus.BAD_REQUEST, "Point amount must be positive"),
    INSUFFICIENT_POINTS("POINT_002", HttpStatus.CONFLICT, "Insufficient points"),
    POINT_TRANSACTION_DUPLICATE("POINT_003", HttpStatus.CONFLICT, "Duplicate point transaction"),

    // ===== CLOUDINARY =====

    // ===== AI =====
    AI_CLOUD_PARSE_ERROR("AI_001", HttpStatus.INTERNAL_SERVER_ERROR, "Failed to parse AI response"),

    // ===== PROMPT =====
    PROMPT_TEMPLATE_NOT_FOUND("AI_002", HttpStatus.NOT_FOUND, "Prompt template not found"),

    // ===== SONG =====
    SONG_NOT_FOUND("SONG_001", HttpStatus.NOT_FOUND, "Song not found"),
    SONG_UNAUTHORIZED_ACCESS("SONG_002", HttpStatus.FORBIDDEN, "Unauthorized access to song"),
    SONG_CANNOT_DELETE_SYSTEM("SONG_003", HttpStatus.BAD_REQUEST, "Cannot delete system song"),

    // ===== APPRULE =====
    APP_RULE_NOT_FOUND("APPRULE_001", HttpStatus.NOT_FOUND, "App rule not found"),
    APP_RULE_ALREADY_EXISTS("APPRULE_002", HttpStatus.CONFLICT, "App rule already exists"),

    // ===== ADMIN =====
    INVALID_ADMIN_USER_STATUS("ADMIN_001", HttpStatus.BAD_REQUEST, "Invalid admin user status"),
    CANNOT_MODIFY_OWN_ACCOUNT("ADMIN_002", HttpStatus.FORBIDDEN, "Cannot modify own account"),
    CANNOT_MODIFY_SUPER_ADMIN("ADMIN_003", HttpStatus.FORBIDDEN, "Cannot modify Super Admin account"),
    INSUFFICIENT_ADMIN_PERMISSION("ADMIN_004", HttpStatus.FORBIDDEN, "Insufficient admin permission"),
    USER_ROLE_ALREADY_ASSIGNED("ADMIN_005", HttpStatus.CONFLICT, "User already has this role"),
    USER_ROLE_NOT_ASSIGNED("ADMIN_006", HttpStatus.NOT_FOUND, "User does not have this role"),


    // ===== PAYMENT =====
    SUBSCRIPTION_PLAN_NOT_FOUND("PAYMENT_001", HttpStatus.NOT_FOUND, "Subscription plan not found"),
    INVALID_PLAN_FOR_PAYMENT("PAYMENT_002", HttpStatus.BAD_REQUEST, "This plan cannot be purchased"),
    TRANSACTION_NOT_FOUND("PAYMENT_003", HttpStatus.NOT_FOUND, "Transaction not found"),
    TRANSACTION_ALREADY_PROCESSED("PAYMENT_004", HttpStatus.BAD_REQUEST, "Transaction already processed"),
    MOMO_REQUEST_FAILED("PAYMENT_005", HttpStatus.BAD_GATEWAY, "Failed to create MoMo payment request"),
    MOMO_SIGNATURE_INVALID("PAYMENT_006", HttpStatus.BAD_REQUEST, "Invalid MoMo signature"),
    MOMO_IPN_INVALID("PAYMENT_007", HttpStatus.BAD_REQUEST, "Invalid MoMo IPN payload"),
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
