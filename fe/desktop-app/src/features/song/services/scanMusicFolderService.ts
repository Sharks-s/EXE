import { invoke } from "@tauri-apps/api/core";
import { songApi } from "../api/song.api";
import type { SongResponse } from "../types/song.types";

interface ScannedSong {
    file_path: string;
    file_name: string;
}

export async function scanMusicFolderService(): Promise<SongResponse[]> {
    // 1. Mở Folder Picker + quét file audio trong thư mục qua Tauri Rust command
    const scannedSongs = await invoke<ScannedSong[]>("scan_music_folder");

    // User bấm Hủy trong dialog -> Rust trả về mảng rỗng, không cần gọi BE
    if (scannedSongs.length === 0) {
        return songApi.getSongs();
    }

    // 2. Gửi danh sách file tìm được lên BE để lưu (bỏ qua trùng, tự tính order_index)
    const response = await songApi.scanFolder({
        songs: scannedSongs.map((s) => ({
            filePath: s.file_path,
            fileName: s.file_name,
        })),
    });

    return response;
}