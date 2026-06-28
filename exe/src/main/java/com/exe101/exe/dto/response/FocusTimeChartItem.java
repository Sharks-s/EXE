package com.exe101.exe.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class FocusTimeChartItem {
    private LocalDate date;
    private Integer focusMinutes;
    private Integer completedSessions;
    private Integer abortedSessions;
}
