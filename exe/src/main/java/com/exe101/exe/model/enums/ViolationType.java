package com.exe101.exe.model.enums;

public enum ViolationType {
    AWAY,          // Không thấy mặt (Rời khỏi ghế)
    LOOK_AWAY,     // Liếc mắt / Quay đầu đi chỗ khác (Gồm cả cúi đầu sâu)
    TOO_CLOSE,     // Ngồi quá sát màn hình (Nguy cơ cận thị)

    // Thêm các loại nhắc nhở nếu ông muốn lưu log sức khỏe vào DB
    BAD_POSTURE,   // Ngồi gù lưng, lệch vai
    POOR_LIGHTING,  // Môi trường thiếu sáng

    PHONE,       // Dùng điện thoại
    ENTERTAINMENT, // Mở app giải trí
}