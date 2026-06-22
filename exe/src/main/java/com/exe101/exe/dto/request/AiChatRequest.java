package com.exe101.exe.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record AiChatRequest(
        String model,
        List<AiMessage> messages,
        double temperature,

        @JsonProperty("max_tokens")
        Integer maxTokens
) {
}