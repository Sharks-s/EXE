export interface SongResponse {
    id: number;
    filePath: string;
    fileName: string;
    orderIndex: number;
    isEnabled: boolean;
    isSystem: boolean;
}

export interface ScanFolderRequest {
    songs: {
        filePath: string;
        fileName: string;
    }[];
}