package com.exe101.exe.controller;

import com.exe101.exe.dto.request.ScanFolderRequest;
import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.dto.response.SongResponse;
import com.exe101.exe.security.CustomUserDetails;
import com.exe101.exe.service.SongService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/songs")
@RequiredArgsConstructor
public class SongController {

    private final SongService songService;

    @PostMapping("/scan")
    public ApiResponse<List<SongResponse>> scanAndAddSongs(
            @Valid @RequestBody ScanFolderRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<SongResponse> response = songService.scanAndAddSongs(userDetails.getId(), request);
        return ApiResponse.success(response);
    }

    @GetMapping
    public ApiResponse<List<SongResponse>> getSongs(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<SongResponse> response = songService.getSongsByUser(userDetails.getId());
        return ApiResponse.success(response);
    }

    @PatchMapping("/{songId}/toggle")
    public ApiResponse<SongResponse> toggleEnabled(
            @PathVariable Long songId,
            @RequestParam boolean isEnabled,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        SongResponse response = songService.toggleEnabled(userDetails.getId(), songId, isEnabled);
        return ApiResponse.success(response);
    }

    @DeleteMapping("/{songId}")
    public ApiResponse<Void> deleteSong(
            @PathVariable Long songId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        songService.deleteSong(userDetails.getId(), songId);
        return ApiResponse.success(null);
    }

    @PostMapping("/seed-system")
    public ApiResponse<List<SongResponse>> seedSystemSongs(
            @Valid @RequestBody ScanFolderRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<SongResponse> response = songService.seedSystemSongs(userDetails.getId(), request);
        return ApiResponse.success(response);
    }
}