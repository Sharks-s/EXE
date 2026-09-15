package com.exe101.exe.model.enums;

public enum TransactionStatus {
    PENDING,    // user đã tạo đơn / đã chuyển khoản, chờ xác nhận
    SUCCESS,    // MoMo đã xác nhận thanh toán thành công (không đảm bảo Subscription đã được cấp —
    // xem Transaction.adminNote nếu fulfillment lỗi cần đối soát thủ công)
    FAILED,     // thanh toán lỗi (dành cho cổng tự động)
    CANCELLED   // user hoặc admin hủy đơn (vd chờ quá lâu không thấy tiền)
}