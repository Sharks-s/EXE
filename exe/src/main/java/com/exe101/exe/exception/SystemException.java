package com.exe101.exe.exception;

public class SystemException extends BaseAppException{
    protected SystemException(ErrorCode errorCode) {
        super(errorCode);
    }

    public SystemException(ErrorCode errorCode, String message) {
        super(errorCode, message);
    }

    public SystemException(ErrorCode errorCode, String message, Throwable cause) {
        super(errorCode, message, cause);
    }
}