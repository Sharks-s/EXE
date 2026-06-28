package com.exe101.exe.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TopViolationAppItem {
    private String appName;
    private Integer count;
}
