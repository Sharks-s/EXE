package com.exe101.exe.dto.response;


import com.exe101.exe.dto.request.AiMessage;

import java.util.List;

import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;


@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record AiChatResponse(
        List<Choice> choices
) {
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record Choice(
            AiMessage message,
            String finishReason
    ) {
    }
}