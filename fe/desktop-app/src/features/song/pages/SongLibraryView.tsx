import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { useSongStore } from "../stores/songStore";
import { useSongPlayerContext } from "./SongPlayerContext";
import { scanMusicFolderService } from "../services/scanMusicFolderService";

function formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds) || seconds < 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function SongLibraryView() {
    const { t } = useTranslation("common");
    const { songs, fetchSongs, setSongs, toggleEnabled, deleteSong } =
        useSongStore();

    const {
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
    } = useSongPlayerContext();

    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        fetchSongs();
    }, [fetchSongs]);

    const handleScanFolder = async () => {
        try {
            setIsScanning(true);
            const latestSongs = await scanMusicFolderService();
            setSongs(latestSongs);
        } catch (err) {
            console.error("[SongLibraryView] Lỗi quét thư mục nhạc:", err);
        } finally {
            setIsScanning(false);
        }
    };

    const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
        const newTime = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
        }
    };

    // Phân loại danh sách bài hát
    const userSongs = useMemo(
        () => songs.filter((s) => !s.isSystem),
        [songs],
    );
    const systemSongs = useMemo(
        () => songs.filter((s) => s.isSystem),
        [songs],
    );
    const enabledPlaylist = useMemo(
        () =>
            songs
                .filter((s) => s.isEnabled)
                .sort((a, b) => a.orderIndex - b.orderIndex),
        [songs],
    );

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            {/* Header trang (chuẩn style petpages/analyticspages) */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm shrink-0">
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 .895-2 3-2 3 .895 3 2zm12 0c0 1.105-1.343 2-3 2s-3-.895-3-2 .895-2 3-2 3 .895 3 2zM9 10l12-3"
                            />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                            {t("songLibrary.title", { defaultValue: "Music Library" })}
                        </h1>
                        <p className="text-sm text-slate-500">
                            {t("songLibrary.subtitle", {
                                defaultValue: "Manage playlists and preview background music played during focus sessions",
                            })}
                        </p>
                    </div>
                </div>
            </header>

            {/* Player Panel nổi khối bên dưới Header */}
            <section className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-slate-200 shadow-xl relative overflow-hidden transition-all">
                <div className="flex flex-col md:flex-row items-center gap-5 sm:gap-6">
                    {/* Icon đĩa nhạc đen to nổi bật */}
                    <div className="relative group shrink-0">
                        <div
                            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-900 flex items-center justify-center shadow-lg border-4 border-slate-800 transition-transform ${isPlaying ? "animate-spin" : ""
                                }`}
                            style={{ animationDuration: "8s" }}
                        >
                            {/* Vòng vân đĩa than */}
                            <div className="w-14 h-14 rounded-full border border-slate-700/80 flex items-center justify-center">
                                <div className="w-9 h-9 rounded-full border border-slate-700/50 flex items-center justify-center bg-emerald-500/10">
                                    {/* Tâm đĩa */}
                                    <div className="w-3.5 h-3.5 bg-slate-100 rounded-full border-2 border-slate-900" />
                                </div>
                            </div>
                        </div>
                        {isPlaying && (
                            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                            </span>
                        )}
                    </div>

                    {/* Nội dung Player */}
                    <div className="flex-1 w-full space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    {isPlaying
                                        ? t("songLibrary.player.now_playing", { defaultValue: "Now Playing (Preview)" })
                                        : t("songLibrary.player.player_title", { defaultValue: "Music Player" })}
                                </span>
                                <h2 className="text-lg font-bold text-slate-800 line-clamp-1">
                                    {currentSong
                                        ? currentSong.fileName
                                        : t("songLibrary.player.no_song_selected", { defaultValue: "No song selected" })}
                                </h2>
                            </div>
                            <div className="text-xs font-mono font-medium text-slate-500 shrink-0">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </div>
                        </div>

                        {/* Thanh tiến độ progress bar với accent màu emerald nổi bật */}
                        <div className="space-y-1">
                            <input
                                type="range"
                                min={0}
                                max={duration || 100}
                                value={currentTime}
                                onChange={handleSeek}
                                disabled={!currentSong}
                                className="w-full h-2 rounded-lg cursor-pointer accent-emerald-500 bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* Nút điều khiển Player */}
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                            {/* Nút Lùi 10 giây */}
                            <button
                                type="button"
                                onClick={seekBackward10s}
                                disabled={!currentSong}
                                title={t("songLibrary.player.rewind_10s", { defaultValue: "-10s" })}
                                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
                                    />
                                </svg>
                                <span>{t("songLibrary.player.rewind_10s", { defaultValue: "-10s" })}</span>
                            </button>

                            {/* Nút Play / Pause sử dụng màu accent tương phản có chủ đích */}
                            <button
                                type="button"
                                onClick={togglePlayPause}
                                disabled={!currentSong}
                                title={
                                    isPlaying
                                        ? t("songLibrary.player.pause", { defaultValue: "Pause" })
                                        : t("songLibrary.player.play", { defaultValue: "Play" })
                                }
                                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-sm shadow-md shadow-emerald-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2"
                            >
                                {isPlaying ? (
                                    <>
                                        <svg
                                            className="w-4 h-4"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                        </svg>
                                        <span>{t("songLibrary.player.pause", { defaultValue: "Pause" })}</span>
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            className="w-4 h-4"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                        <span>{t("songLibrary.player.play", { defaultValue: "Play" })}</span>
                                    </>
                                )}
                            </button>

                            {/* Nút Tiến 10 giây */}
                            <button
                                type="button"
                                onClick={seekForward10s}
                                disabled={!currentSong}
                                title={t("songLibrary.player.forward_10s", { defaultValue: "+10s" })}
                                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                                <span>{t("songLibrary.player.forward_10s", { defaultValue: "+10s" })}</span>
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6L14.6 7.2A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
                                    />
                                </svg>
                            </button>

                            {/* Thanh âm lượng */}
                            <div className="flex items-center gap-2 ml-auto min-w-[140px]">
                                <svg
                                    className="w-4 h-4 text-slate-400 shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"
                                    />
                                </svg>
                                <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    value={volume}
                                    onChange={(e) => setVolume(Number(e.target.value))}
                                    className="w-full h-1.5 rounded-lg cursor-pointer accent-slate-600 bg-slate-200"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2 Cột nội dung chính bên dưới Player */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CỘT TRÁI — Thư viện của bạn (QUẢN LÝ) */}
                <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    {t("songLibrary.my_library.title", { defaultValue: "Your Library" })}
                                </h2>
                                <p className="text-xs text-slate-500">
                                    {t("songLibrary.my_library.subtitle", {
                                        defaultValue: "Manage and enable/disable songs you want to play",
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* Nút "+ Chọn thư mục nhạc" */}
                        <button
                            type="button"
                            onClick={handleScanFolder}
                            disabled={isScanning}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-60"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            <span>
                                {isScanning
                                    ? t("songLibrary.my_library.scanning", { defaultValue: "Scanning folder..." })
                                    : t("songLibrary.my_library.scan_button", { defaultValue: "+ Select Music Folder" })}
                            </span>
                        </button>

                        {/* Danh sách nhạc cá nhân của user */}
                        <div className="space-y-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                {t("songLibrary.my_library.user_songs_title", {
                                    count: userSongs.length,
                                    defaultValue: `Personal Songs (${userSongs.length})`,
                                })}
                            </span>

                            {userSongs.length === 0 ? (
                                <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    {t("songLibrary.my_library.no_user_songs", {
                                        defaultValue: "No personal songs yet. Click the button above to select a music folder.",
                                    })}
                                </div>
                            ) : (
                                <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                                    {userSongs.map((song) => (
                                        <div
                                            key={song.id}
                                            onClick={() => toggleEnabled(song.id, !song.isEnabled)}
                                            className={`flex items-center justify-between p-2.5 rounded-xl transition-colors cursor-pointer select-none border ${song.isEnabled
                                                ? "bg-slate-50/80 border-slate-200 text-slate-900"
                                                : "hover:bg-slate-50 border-transparent text-slate-600"
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                                                {song.isEnabled && (
                                                    <span className="text-emerald-600 font-bold text-sm shrink-0">
                                                        ✓
                                                    </span>
                                                )}
                                                <span
                                                    className={`text-sm truncate ${song.isEnabled ? "font-bold" : "font-normal"
                                                        }`}
                                                    title={song.fileName}
                                                >
                                                    {song.fileName}
                                                </span>
                                            </div>

                                            {/* Nút Xóa bài hát cá nhân */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteSong(song.id);
                                                }}
                                                title={t("songLibrary.my_library.delete_tooltip", {
                                                    defaultValue: "Delete song",
                                                })}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                                            >
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Ngăn cách bằng đường kẻ đứt */}
                        <div className="border-t border-dashed border-slate-200 my-4" />

                        {/* Mục con "Nhạc hệ thống" */}
                        <div className="space-y-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <span>
                                    {t("songLibrary.my_library.system_songs_title", {
                                        count: systemSongs.length,
                                        defaultValue: `System Songs (${systemSongs.length})`,
                                    })}
                                </span>
                            </span>

                            {systemSongs.length === 0 ? (
                                <div className="text-center py-4 text-slate-400 text-xs italic">
                                    {t("songLibrary.my_library.no_system_songs", {
                                        defaultValue: "No system songs.",
                                    })}
                                </div>
                            ) : (
                                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                                    {systemSongs.map((song) => (
                                        <div
                                            key={song.id}
                                            onClick={() => toggleEnabled(song.id, !song.isEnabled)}
                                            className={`flex items-center justify-between p-2.5 rounded-xl transition-colors cursor-pointer select-none border ${song.isEnabled
                                                ? "bg-slate-50/80 border-slate-200 text-slate-900"
                                                : "hover:bg-slate-50 border-transparent text-slate-600"
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                {song.isEnabled && (
                                                    <span className="text-emerald-600 font-bold text-sm shrink-0">
                                                        ✓
                                                    </span>
                                                )}
                                                <span
                                                    className={`text-sm truncate ${song.isEnabled ? "font-bold" : "font-normal"
                                                        }`}
                                                    title={song.fileName}
                                                >
                                                    {song.fileName}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 uppercase tracking-wider shrink-0">
                                                {t("songLibrary.my_library.system_badge", { defaultValue: "System" })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* CỘT PHẢI — Danh sách phát (NGHE THỬ) */}
                <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col">
                    <div className="space-y-4 flex-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    {t("songLibrary.playlist.title", { defaultValue: "Playlist" })}
                                </h2>
                                <p className="text-xs text-slate-500">
                                    {t("songLibrary.playlist.subtitle", {
                                        defaultValue: "Selected songs — will play during Focus Sessions",
                                    })}
                                </p>
                            </div>
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                {t("songLibrary.playlist.count_badge", {
                                    count: enabledPlaylist.length,
                                    defaultValue: `${enabledPlaylist.length} tracks`,
                                })}
                            </span>
                        </div>

                        {enabledPlaylist.length === 0 ? (
                            <div className="text-center py-12 px-4 text-slate-400 text-sm italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                {t("songLibrary.playlist.no_enabled_songs", {
                                    defaultValue: "No songs selected. Check songs from the left column to add them to the playlist.",
                                })}
                            </div>
                        ) : (
                            <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
                                {enabledPlaylist.map((song, idx) => {
                                    const isCurrent = currentSong?.id === song.id;

                                    return (
                                        <div
                                            key={song.id}
                                            onClick={() => playSpecificSong(song.id)}
                                            className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer select-none border ${isCurrent
                                                ? "bg-blue-50/90 border-blue-200 text-blue-900 shadow-sm"
                                                : "hover:bg-slate-50 border-transparent text-slate-700"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                {/* Icon đánh dấu bài đang phát hoặc STT */}
                                                <div className="w-6 text-center shrink-0">
                                                    {isCurrent ? (
                                                        <span className="text-blue-600 font-bold text-sm animate-pulse">
                                                            ▶
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs font-mono text-slate-400">
                                                            {idx + 1}
                                                        </span>
                                                    )}
                                                </div>

                                                <span
                                                    className={`text-sm truncate ${isCurrent ? "font-bold text-blue-900" : "font-medium"
                                                        }`}
                                                    title={song.fileName}
                                                >
                                                    {song.fileName}
                                                </span>
                                            </div>

                                            {isCurrent && isPlaying && (
                                                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                                                    {t("songLibrary.playlist.currently_playing", {
                                                        defaultValue: "Playing",
                                                    })}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}