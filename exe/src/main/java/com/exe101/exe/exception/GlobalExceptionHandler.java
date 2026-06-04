package com.exe101.exe.exception;

import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.dto.response.ValidationError;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.authentication.LockedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.security.core.AuthenticationException;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
    //----------
    @ExceptionHandler(BaseAppException.class)
    public ResponseEntity<ApiResponse<Object>> handleException(
            BaseAppException ex,
            HttpServletRequest request
    ) {
        ErrorCode errorCode = ex.getErrorCode();

        if (errorCode.getHttpStatus().is5xxServerError()) {
            log.error("System error", ex);
        } else {
            log.warn("Business error: {}", ex.getMessage());
        }

        Object data = null;
        if (ex instanceof BusinessException businessEx) {
            data = businessEx.getData();
        }

        return ResponseEntity
                .status(errorCode.getHttpStatus())
                .body(buildBusinessErrorResponse(
                        errorCode.getCode(),
                        ex.getMessage(),
                        data,
                        request
                ));
    }

    //----------validate-----
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleException(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        List<ValidationError> errors =
                ex.getBindingResult()
                        .getFieldErrors()
                        .stream()
                        .collect(Collectors.toMap(
                                FieldError::getField,
                                this::mapToValidationError,
                                (first, second) -> first
                        ))
                        .values()
                        .stream()
                        .toList();

        return ResponseEntity
                .status(ErrorCode.VALIDATION_FAILED.getHttpStatus())
                .body(buildValidationErrorResponse(
                        ErrorCode.VALIDATION_FAILED.getCode(),
                        ErrorCode.VALIDATION_FAILED.getDefaultMessage(),
                        errors,
                        request
                ));
    }

    //----------auth-----
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthenticationException(
            AuthenticationException ex,
            HttpServletRequest request
    ) {
        ErrorCode errorCode = ErrorCode.UNAUTHORIZED;
        HttpStatus status = HttpStatus.UNAUTHORIZED;

        if (ex instanceof BadCredentialsException) {
            // Sai email/password
            errorCode = ErrorCode.INVALID_CREDENTIALS;
            status = HttpStatus.UNAUTHORIZED; // 401
        }
        else if (ex instanceof LockedException) {
            // Tài khoản bị khóa
            errorCode = ErrorCode.LOCKED;
            status = HttpStatus.LOCKED;
        }
        else if (ex instanceof DisabledException) {
            // Tài khoản chưa được kích hoạt
            errorCode = ErrorCode.FORBIDDEN;
            status = HttpStatus.FORBIDDEN;
        }
        else if (ex instanceof InsufficientAuthenticationException) {
            // Token invalid, hết hạn hoặc không gửi kèm Token
            errorCode = ErrorCode.UNAUTHORIZED;
            status = HttpStatus.UNAUTHORIZED;
        }

        ApiResponse<Void> body = ApiResponse.<Void>builder()
                .success(false)
                .code(errorCode.getCode())
                .message(errorCode.getDefaultMessage())
                .timestamp(Instant.now())
                .path(request.getRequestURI())
                .build();

        return ResponseEntity.status(status).body(body);
    }

    //--------other----
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleUnhandledException(
            Exception ex,
            HttpServletRequest request
    ) {
        log.error("Unhandled error", ex);

        return ResponseEntity
                .status(ErrorCode.INTERNAL_ERROR.getHttpStatus())
                .body(buildBusinessErrorResponse(
                        ErrorCode.INTERNAL_ERROR.getCode(),
                        ErrorCode.INTERNAL_ERROR.getDefaultMessage(),
                        null,
                        request
                ));
    }

    //---------- Helper-------
    private ApiResponse<Object> buildBusinessErrorResponse(
            String code,
            String message,
            Object data,
            HttpServletRequest request
    ) {
        return ApiResponse.builder()
                .success(false)
                .code(code)
                .message(message)
                .data(data)
                .timestamp(Instant.now())
                .path(request.getRequestURI())
                .requestId(request.getHeader("X-Request-Id"))
                .build();
    }

    private ApiResponse<Void> buildValidationErrorResponse(
            String code,
            String message,
            List<ValidationError> errors,
            HttpServletRequest request
    ) {
        return ApiResponse.<Void>builder()
                .success(false)
                .code(code)
                .message(message)
                .errors(errors)
                .timestamp(Instant.now())
                .path(request.getRequestURI())
                .requestId(request.getHeader("X-Request-Id"))
                .build();
    }

    private ValidationError mapToValidationError(FieldError fieldError) {
        return ValidationError.builder()
                .field(fieldError.getField())
                .message(fieldError.getDefaultMessage())
                .annotation(formatAnnotation(fieldError.getCode()))
                .params(extractParams(fieldError))
                .build();
    }

    private Map<String, Object> extractParams(FieldError error) {

        Map<String, Object> params = new HashMap<>();
        Object[] args = error.getArguments();

        if (args == null) return params;

        String code = error.getCode();
        if (code == null) return params;

        switch (code) {

            case "Size", "Length" -> {
                if (args.length >= 3) {
                    params.put("max", args[1]);
                    params.put("min", args[2]);
                }
            }

            case "Min", "Max", "DecimalMin", "DecimalMax" -> {
                if (args.length >= 2) {
                    params.put("value", args[1]);
                }
            }

        }

        return params;
    }

    private String formatAnnotation(String code) {
        if (code == null || code.isEmpty()) return "default";
        // Chuyển ký tự đầu tiên thành chữ thường để khớp với "notBlank", "size" trong JSON
        return code.substring(0, 1).toLowerCase() + code.substring(1);
    }
}
