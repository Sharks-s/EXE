package com.exe101.exe.exception;

import lombok.Getter;

@Getter
public class BusinessException extends BaseAppException{
    private Object data;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode);
    }

    public BusinessException(ErrorCode errorCode, Object data) {
        super(errorCode);
        this.data = data;
    }

    public BusinessException(ErrorCode errorCode, String message) {
        super(errorCode, message);
    }

    public BusinessException(ErrorCode errorCode, String message, Throwable cause) {
        super(errorCode, message, cause);
    }
}