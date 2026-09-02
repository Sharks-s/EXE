// features/song/stores/songStore.ts
import { create } from "zustand";
import type { SongResponse } from "../types/song.types";
import { songApi } from "../api/song.api";

interface SongState {
    songs: SongResponse[];
    currentSongId: number | null;
    isPlaying: boolean;
    isListOpen: boolean;

    // ── ACTIONS ──
    fetchSongs: () => Promise<void>;
    setSongs: (songs: SongResponse[]) => void;
    playSong: (songId: number) => void;
    pauseSong: () => void;
    toggleListOpen: () => void;

    toggleEnabled: (songId: number, isEnabled: boolean) => Promise<void>;
    deleteSong: (songId: number) => Promise<void>;

    // Dừng + reset toàn bộ trạng thái đang phát (dùng lúc chuyển sang Session)
    resetPlayback: () => void;

    // Lấy danh sách mới nhất từ BE + tự phát bài đầu tiên đã tích (dùng lúc vào Session)
    startSessionPlayback: () => Promise<void>;
}

export const useSongStore = create<SongState>((set, get) => ({
    songs: [],
    currentSongId: null,
    isPlaying: false,
    isListOpen: false,

    fetchSongs: async () => {
        const songs = await songApi.getSongs();
        set({ songs });
    },

    setSongs: (songs) => set({ songs }),

    playSong: (songId) => set({ currentSongId: songId, isPlaying: true }),

    pauseSong: () => set({ isPlaying: false }),

    toggleListOpen: () =>
        set((state) => ({ isListOpen: !state.isListOpen })),

    toggleEnabled: async (songId, isEnabled) => {
        const updated = await songApi.toggleEnabled(songId, isEnabled);
        set((state) => ({
            songs: state.songs.map((s) => (s.id === updated.id ? updated : s)),
        }));
    },

    deleteSong: async (songId) => {
        await songApi.deleteSong(songId);
        set((state) => ({
            songs: state.songs.filter((s) => s.id !== songId),
            // Nếu đang phát đúng bài bị xóa -> dừng lại
            currentSongId:
                state.currentSongId === songId ? null : state.currentSongId,
            isPlaying: state.currentSongId === songId ? false : state.isPlaying,
        }));
    },

    resetPlayback: () => set({ currentSongId: null, isPlaying: false }),

    startSessionPlayback: async () => {
        get().resetPlayback();

        const songs = await songApi.getSongs();
        set({ songs });

        const firstEnabled = songs.find((s) => s.isEnabled);
        if (firstEnabled) {
            set({ currentSongId: firstEnabled.id, isPlaying: false });
        }
    },
}));