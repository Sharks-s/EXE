package com.exe101.exe.model.enums;

public enum TransactionStatus {
    PENDING,    // user đã tạo đơn / đã chuyển khoản, chờ xác nhận
    SUCCESS,    // đã xác nhận có tiền, Subscription đã tạo
    FAILED,     // thanh toán lỗi (dành cho cổng tự động)
    CANCELLED   // user hoặc admin hủy đơn (vd chờ quá lâu không thấy tiền)
}