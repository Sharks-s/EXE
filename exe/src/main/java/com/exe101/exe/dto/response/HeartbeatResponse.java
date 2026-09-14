package com.exe101.exe.dto.response;

public record HeartbeatResponse(
        Integer dailyUsedMinutes,
        Integer dailyLimitMinutes,
        Boolean unlimited
) {}
