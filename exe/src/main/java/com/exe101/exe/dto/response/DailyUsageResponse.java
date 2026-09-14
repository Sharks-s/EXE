package com.exe101.exe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyUsageResponse {
    private Integer dailyUsedMinute;
    private Integer dailyLimitMinute;
    private Integer remainingMinute;
    private Boolean unlimited;
}
