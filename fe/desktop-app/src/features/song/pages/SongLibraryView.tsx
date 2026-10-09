import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { useSongStore } from "../stores/songStore";
import { useSongPlayerContext } from "./SongPlayerContext";
import { scanMusicFolderService } from "../services/scanMusicFolderService";
import { seedSystemSongsService } from "../services/seedSystemSongsService";
import "./SongLibraryView.css";

function formatTime(seconds: number): string {
  if (!seconds || Number.isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function MaterialIcon({ name, filled = false }: { name: string; filled?: boolean }) {
  return (
    <span className={`material-symbols-outlined ${filled ? "music-icon-filled" : ""}`}>
      {name}
    </span>
  );
}

export default function SongLibraryView() {
  const { t } = useTranslation("common");
  const { songs, fetchSongs, setSongs, toggleEnabled, deleteSong } = useSongStore();
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
    let isMounted = true;

    async function loadSongs() {
      await fetchSongs();

      const currentSongs = useSongStore.getState().songs;
      if (isMounted && currentSongs.length === 0) {
        setSongs(await seedSystemSongsService());
      }
    }

    loadSongs().catch((error) => {
      console.error("[SongLibraryView] Lỗi tải danh sách nhạc:", error);
    });

    return () => {
      isMounted = false;
    };
  }, [fetchSongs, setSongs]);

  const handleScanFolder = async () => {
    try {
      setIsScanning(true);
      setSongs(await scanMusicFolderService());
    } catch (error) {
      console.error("[SongLibraryView] Lỗi quét thư mục nhạc:", error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSeek = (event: ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) audioRef.current.currentTime = Number(event.target.value);
  };

  const userSongs = useMemo(() => songs.filter((song) => !song.isSystem), [songs]);
  const systemSongs = useMemo(() => songs.filter((song) => song.isSystem), [songs]);
  const enabledPlaylist = useMemo(
    () => songs.filter((song) => song.isEnabled).sort((a, b) => a.orderIndex - b.orderIndex),
    [songs],
  );

  return (
    <div className="music-page">
      <main className="music-shell">
        <header className="app-page-header music-header">
          <div className="app-page-title">
            <div className="app-page-title-row">
              <span className="app-page-title-icon">
                <MaterialIcon name="music_note" />
              </span>
              <h1>{t("songLibrary.title", { defaultValue: "Thư viện nhạc" })}</h1>
            </div>
            <p>
              {t("songLibrary.subtitle", {
                defaultValue: "Quản lý danh sách phát và nghe thử nhạc nền trong phiên tập trung",
              })}
            </p>
          </div>

          <div className="music-header-count" aria-label={t("songLibrary.playlist.title")}>
            <span><MaterialIcon name="queue_music" /></span>
            <div>
              <strong>{enabledPlaylist.length}</strong>
              <small>{t("songLibrary.playlist.count_badge", { count: enabledPlaylist.length })}</small>
            </div>
          </div>
        </header>

        <section className="music-player-card">
          <div className="music-record-wrap" aria-hidden="true">
            <div className={`music-record ${isPlaying ? "is-playing" : ""}`}>
              <span className="music-record-ring">
                <span className="music-record-label">
                  <span />
                </span>
              </span>
            </div>
            {isPlaying && <span className="music-live-dot" />}
          </div>

          <div className="music-player-content">
            <div className="music-track-heading">
              <div>
                <span className="music-eyebrow">
                  {isPlaying
                    ? t("songLibrary.player.now_playing", { defaultValue: "Đang phát nghe thử" })
                    : t("songLibrary.player.player_title", { defaultValue: "Trình phát nhạc" })}
                </span>
                <h2>
                  {currentSong?.fileName ??
                    t("songLibrary.player.no_song_selected", { defaultValue: "Chưa chọn bài hát" })}
                </h2>
              </div>
              <span className="music-time">
                {formatTime(currentTime)} <i>/</i> {formatTime(duration)}
              </span>
            </div>

            <input
              className="music-progress"
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              disabled={!currentSong}
              aria-label={t("songLibrary.player.player_title")}
            />

            <div className="music-controls">
              <button
                className="music-control-button"
                type="button"
                onClick={seekBackward10s}
                disabled={!currentSong}
                title={t("songLibrary.player.rewind_10s", { defaultValue: "-10s" })}
              >
                <MaterialIcon name="replay_10" />
              </button>
              <button
                className="music-play-button"
                type="button"
                onClick={togglePlayPause}
                disabled={!currentSong}
                title={isPlaying ? t("songLibrary.player.pause") : t("songLibrary.player.play")}
              >
                <MaterialIcon name={isPlaying ? "pause" : "play_arrow"} filled />
                <span>
                  {isPlaying
                    ? t("songLibrary.player.pause", { defaultValue: "Tạm dừng" })
                    : t("songLibrary.player.play", { defaultValue: "Phát" })}
                </span>
              </button>
              <button
                className="music-control-button"
                type="button"
                onClick={seekForward10s}
                disabled={!currentSong}
                title={t("songLibrary.player.forward_10s", { defaultValue: "+10s" })}
              >
                <MaterialIcon name="forward_10" />
              </button>

              <div className="music-volume">
                <MaterialIcon name={volume === 0 ? "volume_off" : "volume_up"} />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  aria-label="Âm lượng"
                />
                <span>{Math.round(volume * 100)}%</span>
              </div>
            </div>
          </div>
        </section>

        <div className="music-library-grid">
          <section className="music-panel music-library-panel">
            <div className="music-panel-header">
              <div className="music-panel-title">
                <span className="music-panel-icon library-icon"><MaterialIcon name="library_music" /></span>
                <div>
                  <h2>{t("songLibrary.my_library.title", { defaultValue: "Thư viện của bạn" })}</h2>
                  <p>{t("songLibrary.my_library.subtitle")}</p>
                </div>
              </div>
              <span className="music-count-badge neutral">{songs.length}</span>
            </div>

            <button
              className="music-scan-button"
              type="button"
              onClick={handleScanFolder}
              disabled={isScanning}
            >
              <MaterialIcon name={isScanning ? "progress_activity" : "create_new_folder"} />
              <span>
                {isScanning
                  ? t("songLibrary.my_library.scanning", { defaultValue: "Đang quét thư mục..." })
                  : t("songLibrary.my_library.scan_button", { defaultValue: "Chọn thư mục nhạc" })}
              </span>
            </button>

            <div className="music-section">
              <div className="music-section-heading">
                <span>{t("songLibrary.my_library.user_songs_title", { count: userSongs.length })}</span>
                <MaterialIcon name="folder_open" />
              </div>
              {userSongs.length === 0 ? (
                <div className="music-empty">
                  <MaterialIcon name="audio_file" />
                  <p>{t("songLibrary.my_library.no_user_songs")}</p>
                </div>
              ) : (
                <div className="music-song-list user-song-list">
                  {userSongs.map((song) => (
                    <div
                      key={song.id}
                      className={`music-song-row ${song.isEnabled ? "is-enabled" : ""}`}
                      onClick={() => toggleEnabled(song.id, !song.isEnabled)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleEnabled(song.id, !song.isEnabled);
                        }
                      }}
                    >
                      <span className="music-song-check">
                        <MaterialIcon name={song.isEnabled ? "check_circle" : "circle"} filled={song.isEnabled} />
                      </span>
                      <span className="music-song-name" title={song.fileName}>{song.fileName}</span>
                      <button
                        className="music-delete-button"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteSong(song.id);
                        }}
                        title={t("songLibrary.my_library.delete_tooltip")}
                      >
                        <MaterialIcon name="delete" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="music-divider" />

            <div className="music-section">
              <div className="music-section-heading">
                <span>{t("songLibrary.my_library.system_songs_title", { count: systemSongs.length })}</span>
                <MaterialIcon name="cloud" />
              </div>
              {systemSongs.length === 0 ? (
                <div className="music-empty compact"><p>{t("songLibrary.my_library.no_system_songs")}</p></div>
              ) : (
                <div className="music-song-list system-song-list">
                  {systemSongs.map((song) => (
                    <div
                      key={song.id}
                      className={`music-song-row ${song.isEnabled ? "is-enabled" : ""}`}
                      onClick={() => toggleEnabled(song.id, !song.isEnabled)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleEnabled(song.id, !song.isEnabled);
                        }
                      }}
                    >
                      <span className="music-song-check">
                        <MaterialIcon name={song.isEnabled ? "check_circle" : "circle"} filled={song.isEnabled} />
                      </span>
                      <span className="music-song-name" title={song.fileName}>{song.fileName}</span>
                      <span className="music-system-badge">{t("songLibrary.my_library.system_badge")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="music-panel music-playlist-panel">
            <div className="music-panel-header">
              <div className="music-panel-title">
                <span className="music-panel-icon playlist-icon"><MaterialIcon name="queue_music" /></span>
                <div>
                  <h2>{t("songLibrary.playlist.title", { defaultValue: "Danh sách phát" })}</h2>
                  <p>{t("songLibrary.playlist.subtitle")}</p>
                </div>
              </div>
              <span className="music-count-badge">{enabledPlaylist.length}</span>
            </div>

            {enabledPlaylist.length === 0 ? (
              <div className="music-empty playlist-empty">
                <MaterialIcon name="playlist_add" />
                <p>{t("songLibrary.playlist.no_enabled_songs")}</p>
              </div>
            ) : (
              <div className="music-playlist-list">
                {enabledPlaylist.map((song, index) => {
                  const isCurrent = currentSong?.id === song.id;
                  return (
                    <button
                      key={song.id}
                      className={`music-playlist-row ${isCurrent ? "is-current" : ""}`}
                      type="button"
                      onClick={() => playSpecificSong(song.id)}
                    >
                      <span className="music-track-index">
                        {isCurrent ? <MaterialIcon name={isPlaying ? "equalizer" : "play_arrow"} /> : index + 1}
                      </span>
                      <span className="music-song-name" title={song.fileName}>{song.fileName}</span>
                      {isCurrent && isPlaying ? (
                        <span className="music-playing-badge">
                          <span />{t("songLibrary.playlist.currently_playing")}
                        </span>
                      ) : (
                        <MaterialIcon name="play_circle" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
