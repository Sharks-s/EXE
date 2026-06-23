package com.exe101.exe.dto.response;

import com.exe101.exe.model.enums.ViolationType;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ViolationTypeAnalyticsItem {
    private ViolationType type;
    private Integer count;
    private Integer minutesDeducted;
}
