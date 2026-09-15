package com.exe101.exe.exception;

/**
 * Ném ra khi KHÔNG THỂ xác định chắc chắn MoMo đã xử lý request create-payment
 * hay chưa (timeout, connection reset, response rỗng bất thường).
 * Khác với lỗi rõ ràng (Momo trả resultCode != 0) — trường hợp này
 * TUYỆT ĐỐI KHÔNG được tự ý mark Transaction FAILED, vì MoMo có thể
 * đã thực sự tạo giao dịch và IPN sẽ đến sau.
 */
public class MomoAmbiguousResultException extends RuntimeException {
    public MomoAmbiguousResultException(String message, Throwable cause) {
        super(message, cause);
    }
}