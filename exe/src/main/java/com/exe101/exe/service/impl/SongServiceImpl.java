package com.exe101.exe.service.impl;

import com.exe101.exe.dto.request.ScanFolderRequest;
import com.exe101.exe.dto.response.SongResponse;
import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.mapper.SongMapper;
import com.exe101.exe.model.entity.Song;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.repository.SongRepository;
import com.exe101.exe.service.SongService;
import com.exe101.exe.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SongServiceImpl implements SongService {

    private final SongRepository songRepository;
    private final UserService userService;
    private final SongMapper songMapper;

    @Override
    @Transactional
    public List<SongResponse> scanAndAddSongs(Long userId, ScanFolderRequest request) {
        User user = userService.findById(userId);

        int nextOrderIndex = songRepository.findMaxOrderIndexByUserId(userId)
                .map(max -> max + 1)
                .orElse(0);

        for (ScanFolderRequest.SongItem item : request.songs()) {
            boolean alreadyExists = songRepository.existsByUserIdAndFilePath(userId, item.filePath());
            if (alreadyExists) continue;

            Song song = Song.builder()
                    .user(user)
                    .filePath(item.filePath())
                    .fileName(stripFileExtension(item.fileName()))
                    .orderIndex(nextOrderIndex)
                    .isEnabled(true)
                    .isSystem(false)
                    .build();

            songRepository.save(song);
            nextOrderIndex++;
        }

        return getSongsByUser(userId);
    }

    @Override
    public List<SongResponse> getSongsByUser(Long userId) {
        return songRepository.findByUserIdOrderByOrderIndexAsc(userId)
                .stream()
                .map(songMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public SongResponse toggleEnabled(Long userId, Long songId, boolean isEnabled) {
        Song song = loadOwnedSong(userId, songId);
        song.setIsEnabled(isEnabled);
        return songMapper.toResponse(songRepository.save(song));
    }

    @Override
    @Transactional
    public void deleteSong(Long userId, Long songId) {
        Song song = loadOwnedSong(userId, songId);

        if (Boolean.TRUE.equals(song.getIsSystem())) {
            throw new BusinessException(ErrorCode.SONG_CANNOT_DELETE_SYSTEM);
        }

        songRepository.delete(song);
    }

    @Override
    @Transactional
    public List<SongResponse> seedSystemSongs(Long userId, ScanFolderRequest request) {
        User user = userService.findById(userId);
        List<Song> existingSystemSongs = songRepository.findByUserIdAndIsSystemTrue(userId);
        Map<String, Song> existingSongsByPath = existingSystemSongs.stream()
                .collect(Collectors.toMap(Song::getFilePath, Function.identity()));
        Set<String> scannedPaths = request.songs().stream()
                .map(ScanFolderRequest.SongItem::filePath)
                .collect(Collectors.toSet());

        List<Song> removedSongs = existingSystemSongs.stream()
                .filter(song -> !scannedPaths.contains(song.getFilePath()))
                .toList();
        if (!removedSongs.isEmpty()) {
            songRepository.deleteAll(removedSongs);
        }

        int nextOrderIndex = songRepository.findMaxOrderIndexByUserId(userId)
                .map(max -> max + 1)
                .orElse(0);

        for (ScanFolderRequest.SongItem item : request.songs()) {
            Song existingSong = existingSongsByPath.get(item.filePath());
            if (existingSong != null) {
                existingSong.setFileName(stripFileExtension(item.fileName()));
                songRepository.save(existingSong);
                continue;
            }

            Song song = Song.builder()
                    .user(user)
                    .filePath(item.filePath())
                    .fileName(stripFileExtension(item.fileName()))
                    .orderIndex(nextOrderIndex)
                    .isEnabled(true)
                    .isSystem(true)
                    .build();

            songRepository.save(song);
            nextOrderIndex++;
        }

        return getSongsByUser(userId);
    }

    private Song loadOwnedSong(Long userId, Long songId) {
        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SONG_NOT_FOUND));

        if (!song.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.SONG_UNAUTHORIZED_ACCESS);
        }
        return song;
    }

    private String stripFileExtension(String fileName) {
        int lastDotIndex = fileName.lastIndexOf('.');
        return lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
    }
}
