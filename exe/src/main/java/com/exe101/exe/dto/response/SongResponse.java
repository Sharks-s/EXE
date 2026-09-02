package com.exe101.exe.dto.response;

public record SongResponse(
        Long id,
        String filePath,
        String fileName,
        Integer orderIndex,
        Boolean isEnabled,
        Boolean isSystem
) {}