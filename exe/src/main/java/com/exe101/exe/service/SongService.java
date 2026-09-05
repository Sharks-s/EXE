package com.exe101.exe.service;

import com.exe101.exe.dto.request.ScanFolderRequest;
import com.exe101.exe.dto.response.SongResponse;

import java.util.List;

public interface SongService {
    List<SongResponse> scanAndAddSongs(Long userId, ScanFolderRequest request);
    List<SongResponse> getSongsByUser(Long userId);
    SongResponse toggleEnabled(Long userId, Long songId, boolean isEnabled);
    void deleteSong(Long userId, Long songId);
    // SongService.java
    List<SongResponse> seedSystemSongs(Long userId, ScanFolderRequest request);

}