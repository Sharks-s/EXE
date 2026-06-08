import { useAuthStore } from "../../auth/stores/authStore";
import { useBotStatus } from "../../bot-monitor/hooks/useBotStatus";

import { useState } from "react";

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const [sessionActive, setSessionActive] = useState(false);

  const {
    faceStatus,
    shouldWarn,
    isCameraRunning,
    isConnected,
    startSession,
    stopSession,
  } = useBotStatus(sessionActive);

  return (
    <div style={{ padding: 32 }}>
      <h1>Xin chào, {user?.email} 👋</h1>

      {/* DEBUG INFO */}
      <div
        style={{
          marginTop: 16,
          padding: 16,
          background: "#f1f5f9",
          borderRadius: 8,
        }}
      >
        <p>Connected: {isConnected ? "✅" : "❌"}</p>
        <p>Camera: {isCameraRunning ? "🟢 Đang chạy" : "⭕ Tắt"}</p>
        <p>
          Face Status: <b>{faceStatus}</b>
        </p>
        <p>Should Warn: {shouldWarn ? "⚠️ Có" : "✅ Không"}</p>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
        <button
          onClick={() => {
            setSessionActive(true);
            startSession();
          }}
          disabled={sessionActive}
        >
          Bắt đầu phiên
        </button>
        <button
          onClick={() => {
            setSessionActive(false);
            stopSession();
          }}
          disabled={!sessionActive}
        >
          Kết thúc phiên
        </button>
        <button onClick={logout}>Đăng xuất</button>
      </div>
    </div>
  );
}
