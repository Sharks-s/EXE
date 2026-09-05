import { invoke } from "@tauri-apps/api/core";
import { songApi } from "../api/song.api";
import type { SongResponse } from "../types/song.types";

interface ScannedSong {
    file_path: string;
    file_name: string;
}

export async function seedSystemSongsService(): Promise<SongResponse[]> {
    const scannedSongs = await invoke<ScannedSong[]>("scan_system_sounds_folder");

    if (scannedSongs.length === 0) return [];

    return songApi.seedSystemSongs({
        songs: scannedSongs.map((s) => ({
            filePath: s.file_path,
            fileName: s.file_name,
        })),
    });
}