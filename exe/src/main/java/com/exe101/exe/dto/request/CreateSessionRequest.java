package com.exe101.exe.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateSessionRequest(

        @NotBlank(message = "{validation.session.goal.notBlank}")
        @Size(max = 255, message = "{validation.session.goal.size}")
        String goal,

        @NotNull(message = "{validation.session.duration.notNull}")
        @Min(value = 1, message = "{validation.session.duration.min}")
        Integer durationMinutes,

        @NotBlank(message = "{validation.session.personality.notBlank}")
        String personality

) {
}