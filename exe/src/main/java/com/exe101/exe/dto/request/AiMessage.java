package com.exe101.exe.dto.request;

public record AiMessage(
        String role,    // "system", "user", hoặc "assistant"
        String content   // Nội dung lời thoại/prompt
) {}