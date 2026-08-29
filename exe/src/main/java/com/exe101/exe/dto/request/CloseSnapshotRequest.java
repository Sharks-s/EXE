package com.exe101.exe.dto.request;

public record CloseSnapshotRequest(
        int elapsedSeconds,
        boolean wasBreaking,
        Integer breakRemainingSeconds // null nếu wasBreaking = false
) {}