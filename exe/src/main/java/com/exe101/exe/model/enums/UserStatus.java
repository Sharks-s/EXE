package com.exe101.exe.model.enums;

public enum UserStatus {
    PENDING,      // mới đăng ký, chưa xác thực
    ACTIVE,       // hoạt động bình thường
    DEACTIVATED,  // user tự khóa tài khoản
    SUSPENDED,    // bị khóa tạm thời bởi hệ thống / admin
    BLOCKED        // bị cấm vĩnh viễn
}
