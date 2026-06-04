package com.exe101.exe.dto.response;

import lombok.*;

@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExchangeResponse {
    private String accessToken;

    private UserSummary user;
}