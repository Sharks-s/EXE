package com.exe101.exe.exception;

public class ExternalServiceException extends BaseAppException{
    public ExternalServiceException(ErrorCode errorCode, String message, Throwable cause) {
        super(errorCode, message, cause);
    }

    public ExternalServiceException(ErrorCode errorCode, String message) {
        super(errorCode, message);
    }

    protected ExternalServiceException(ErrorCode errorCode) {
        super(errorCode);
    }
}
