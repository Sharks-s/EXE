package com.exe101.exe.dto.request;

import java.util.List;

public record AiChatRequest(
        String model,
        List<AiMessage> messages,
        double temperature
) {}