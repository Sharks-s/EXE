import api from "@/lib/axios";
import type { SongResponse, ScanFolderRequest } from "../types/song.types";

export const songApi = {
    // POST /songs/scan
    scanFolder: async (data: ScanFolderRequest): Promise<SongResponse[]> => {
        const res = await api.post("/songs/scan", data);
        return res.data.data;
    },

    // GET /songs
    getSongs: async (): Promise<SongResponse[]> => {
        const res = await api.get("/songs");
        return res.data.data;
    },

    // PATCH /songs/{id}/toggle?isEnabled=true/false
    toggleEnabled: async (
        songId: number,
        isEnabled: boolean,
    ): Promise<SongResponse> => {
        const res = await api.patch(`/songs/${songId}/toggle`, null, {
            params: { isEnabled },
        });
        return res.data.data;
    },

    // DELETE /songs/{id}
    deleteSong: async (songId: number): Promise<void> => {
        await api.delete(`/songs/${songId}`);
    },

    // POST /songs/seed-system
    seedSystemSongs: async (data: ScanFolderRequest): Promise<SongResponse[]> => {
        const res = await api.post("/songs/seed-system", data);
        return res.data.data;
    },
};