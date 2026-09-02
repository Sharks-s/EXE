// features/song/hooks/useSongPlayer.ts
import { useEffect, useRef, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useSongStore } from "../stores/songStore";

const DEFAULT_VOLUME = 0.7;

export function useSongPlayer() {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const { songs, currentSongId, isPlaying, playSong, pauseSong } =
        useSongStore();

    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [volume, setVolumeState] = useState<number>(DEFAULT_VOLUME);

    const currentSong = songs.find((s) => s.id === currentSongId) ?? null;

    // ── Đổi bài -> đổi src của thẻ audio ──
    useEffect(() => {
        if (!audioRef.current || !currentSong) return;

        audioRef.current.src = convertFileSrc(currentSong.filePath);
        audioRef.current.volume = volume;
        setCurrentTime(0);
        setDuration(0);

        if (isPlaying) {
            audioRef.current.play().catch((err) => {
                console.error("[useSongPlayer] Lỗi phát nhạc:", err);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentSongId]);

    // ── Đồng bộ Play/Pause theo store (khi user bấm nút ngoài UI) ──
    useEffect(() => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.play().catch((err) => {
                console.error("[useSongPlayer] Lỗi phát nhạc:", err);
            });
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying]);

    // ── Tìm bài tiếp theo trong danh sách (bỏ qua bài không tích), loop khi hết ──
    const findNextEnabledSong = () => {
        const enabledSongs = songs.filter((s) => s.isEnabled);
        if (enabledSongs.length === 0) return null;

        const currentIndex = enabledSongs.findIndex((s) => s.id === currentSongId);
        const nextIndex = (currentIndex + 1) % enabledSongs.length; // hết list -> quay lại đầu (loop)

        return enabledSongs[nextIndex];
    };

    const handleEnded = () => {
        const next = findNextEnabledSong();
        if (next) {
            playSong(next.id);
        } else {
            pauseSong();
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) setDuration(audioRef.current.duration);
    };

    const handleError = () => {
        console.error("[useSongPlayer] Lỗi đọc file, bỏ qua bài:", currentSong?.fileName);
        handleEnded(); // File lỗi (VD user xóa khỏi máy) -> tự động skip qua bài tiếp theo
    };

    // ── Điều khiển thủ công ──
    const togglePlayPause = () => {
        if (isPlaying) {
            pauseSong();
        } else if (currentSong) {
            playSong(currentSong.id);
        }
    };

    const seekBackward10s = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.max(
                0,
                audioRef.current.currentTime - 10,
            );
        }
    };

    const seekForward10s = () => {
        if (audioRef.current) {
            const maxTime = audioRef.current.duration || Infinity;
            audioRef.current.currentTime = Math.min(
                maxTime,
                audioRef.current.currentTime + 10,
            );
        }
    };

    const setVolume = (value: number) => {
        const clamped = Math.min(1, Math.max(0, value));
        if (audioRef.current) audioRef.current.volume = clamped;
        setVolumeState(clamped);
    };

    const playSpecificSong = (songId: number) => {
        playSong(songId);
    };

    return {
        audioRef,
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        setVolume,
        togglePlayPause,
        seekBackward10s,
        seekForward10s,
        playSpecificSong,
        handleEnded,
        handleTimeUpdate,
        handleLoadedMetadata,
        handleError,
    };
}