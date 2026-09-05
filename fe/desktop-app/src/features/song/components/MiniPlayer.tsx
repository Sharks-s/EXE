import { useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { useSongStore } from "../stores/songStore";
import { useSongPlayerContext } from "../pages/SongPlayerContext";

function formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds) || seconds < 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function MiniPlayer() {
    const { t } = useTranslation("common");
    const { songs, isListOpen, toggleListOpen } = useSongStore();
    const [isVolumeOpen, setIsVolumeOpen] = useState(false);

    const {
        audioRef,
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        setVolume,
        togglePlayPause,
        playSpecificSong,
    } = useSongPlayerContext();

    const enabledPlaylist = songs
        .filter((s) => s.isEnabled)
        .sort((a, b) => a.orderIndex - b.orderIndex);

    const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
        const newTime = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
        }
    };

    return (
        <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm z-30">
            {/* ── Dòng thu gọn mặc định ── */}
            <div className="flex items-center gap-3 px-4 py-3">
                {/* Nút Play/Pause */}
                <button
                    type="button"
                    onClick={togglePlayPause}
                    disabled={!currentSong}
                    className="shrink-0 w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {isPlaying ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="5" width="4" height="14" rx="1" />
                            <rect x="14" y="5" width="4" height="14" rx="1" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    )}
                </button>

                {/* Tên bài + thanh tiến độ (kiêm tua) */}
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-700 truncate">
                        {currentSong
                            ? currentSong.fileName
                            : t("miniPlayer.no_song_selected", { defaultValue: "No song selected" })}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <input
                            type="range"
                            min={0}
                            max={duration || 100}
                            value={currentTime}
                            onChange={handleSeek}
                            disabled={!currentSong}
                            className="w-full h-1.5 rounded-lg cursor-pointer accent-emerald-500 bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                        <span className="shrink-0 text-[10px] font-mono text-slate-400 tabular-nums">
                            {formatTime(currentTime)}/{formatTime(duration)}
                        </span>
                    </div>
                </div>

                {/* Nút Loa âm lượng */}
                <button
                    type="button"
                    onClick={() => setIsVolumeOpen((prev) => !prev)}
                    className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                        isVolumeOpen
                            ? "bg-blue-50 text-blue-600"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                    title={t("miniPlayer.volume_tooltip", { defaultValue: "Volume" })}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {volume === 0 ? (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M11 5L6 9H2v6h4l5 4V5zM17 9l6 6M23 9l-6 6"
                            />
                        ) : (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"
                            />
                        )}
                    </svg>
                </button>

                {/* Nút xổ List */}
                <button
                    type="button"
                    onClick={toggleListOpen}
                    className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isListOpen
                        ? "bg-blue-50 text-blue-600"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                    title={t("miniPlayer.playlist_tooltip", { defaultValue: "Playlist" })}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 6h16M4 12h16M4 18h7"
                        />
                    </svg>
                </button>
            </div>

            {/* ── Dropdown chỉnh âm lượng ── */}
            {isVolumeOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-3 flex items-center gap-3 w-52">
                    <button
                        type="button"
                        onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
                        className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {volume === 0 ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5L6 9H2v6h4l5 4V5zM17 9l6 6M23 9l-6 6" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07" />
                            )}
                        </svg>
                    </button>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-full h-1.5 rounded-lg cursor-pointer accent-emerald-500 bg-slate-200"
                    />
                    <span className="text-xs font-mono text-slate-500 w-8 text-right shrink-0">
                        {Math.round(volume * 100)}%
                    </span>
                </div>
            )}

            {/* ── Danh sách phát — floating overlay bên dưới ── */}
            {isListOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 max-h-56 overflow-y-auto py-1">
                    {enabledPlaylist.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-slate-400 italic">
                            {t("miniPlayer.no_enabled_songs", {
                                defaultValue: "No songs selected. Go to \"Music Library\" to add songs.",
                            })}
                        </p>
                    ) : (
                        enabledPlaylist.map((song) => {
                            const isCurrent = currentSong?.id === song.id;
                            return (
                                <div
                                    key={song.id}
                                    onClick={() => playSpecificSong(song.id)}
                                    className={`flex items-center gap-2 px-4 py-2 cursor-pointer select-none transition-colors ${isCurrent
                                        ? "bg-blue-50 text-blue-700 font-semibold"
                                        : "hover:bg-slate-50 text-slate-600 font-normal"
                                        }`}
                                >
                                    <span className="w-4 text-center shrink-0">
                                        {isCurrent && isPlaying ? (
                                            <span className="text-blue-600">▶</span>
                                        ) : null}
                                    </span>
                                    <span className="text-xs truncate">{song.fileName}</span>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}