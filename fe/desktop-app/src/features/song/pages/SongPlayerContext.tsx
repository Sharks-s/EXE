import { createContext, useContext, type ReactNode } from "react";
import { useSongPlayer } from "../hooks/useSongPlayer";

type SongPlayerContextValue = ReturnType<typeof useSongPlayer>;

const SongPlayerContext = createContext<SongPlayerContextValue | null>(null);

export function SongPlayerProvider({ children }: { children: ReactNode }) {
    const player = useSongPlayer();

    return (
        <SongPlayerContext.Provider value={player}>
            <audio
                ref={player.audioRef}
                onEnded={player.handleEnded}
                onTimeUpdate={player.handleTimeUpdate}
                onLoadedMetadata={player.handleLoadedMetadata}
                onError={player.handleError}
            />
            {children}
        </SongPlayerContext.Provider>
    );
}

export function useSongPlayerContext() {
    const ctx = useContext(SongPlayerContext);
    if (!ctx) {
        throw new Error(
            "useSongPlayerContext phải được dùng bên trong SongPlayerProvider",
        );
    }
    return ctx;
}