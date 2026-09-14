package com.exe101.exe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionPlanResponse {
    private Long id;
    private String code;
    private String name;
    private String description;
    private String plan;
    private String billingCycle;
    private Integer priceVnd;
    private Integer durationDays;
    private Integer dailyLimitMinutes;
    private boolean unlimitedUsage;
    private boolean active;
}
