package com.exe101.exe.dto.response;

import com.exe101.exe.model.enums.ViolationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ViolationResponse {
    private ViolationType type;
    private int minutesDeducted;
    private String appName;
    private String windowTitle;
    private Instant occurredAt;
}
