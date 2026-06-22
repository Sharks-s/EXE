package com.exe101.exe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiBubbleAction {
    private String label;      // Nhãn của nút (Ví dụ: "Nghỉ tí ☕", "Cày tiếp 🎯")
    private String variant;    // Giao diện nút ("primary" hoặc "secondary")
}