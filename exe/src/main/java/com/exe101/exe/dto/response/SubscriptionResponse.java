package com.exe101.exe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionResponse {
    private Long id;
    private String plan;
    private String billingCycle;
    private Instant startedAt;
    private Instant expiresAt;
    private boolean active;
    private boolean unlimited;
}
