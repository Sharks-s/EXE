package com.exe101.exe.dto.request;

import java.util.List;

public record ScanFolderRequest(
        List<SongItem> songs
) {
    public record SongItem(
            String filePath,
            String fileName
    ) {}
}