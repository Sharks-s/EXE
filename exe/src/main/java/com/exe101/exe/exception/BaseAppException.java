package com.exe101.exe.exception;

import lombok.Getter;

@Getter
public class BaseAppException extends RuntimeException {
    private final ErrorCode errorCode;

    protected BaseAppException(ErrorCode errorCode) {
        super(errorCode.getDefaultMessage());
        this.errorCode = errorCode;
    }

    public BaseAppException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public BaseAppException(ErrorCode errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }
}