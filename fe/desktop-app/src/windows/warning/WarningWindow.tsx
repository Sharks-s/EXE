import { useEffect, useRef, useState } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { listen } from "@tauri-apps/api/event";

const AUTO_HIDE_MS = 10000;

export default function WarningWindow() {
  const [message, setMessage] = useState<string>("Hình như bạn đang bị xao nhãng?");
  const hideTimerRef = useRef<number | null>(null);

  const hideSelf = async () => {
    try {
      const currentWin = getCurrentWebviewWindow();
      await currentWin.hide();
    } catch (error) {
      console.error("Lỗi khi ẩn cửa sổ cảnh báo:", error);
    }
  };

  useEffect(() => {
    const unlisten = listen<{ message: string }>("warning-update", async (event) => {
      setMessage(event.payload.message);

      try {
        const currentWin = getCurrentWebviewWindow();
        await currentWin.show();
        await currentWin.setFocus();
      } catch (error) {
        console.error("Lỗi khi hiện cửa sổ cảnh báo:", error);
      }

      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = window.setTimeout(() => {
        hideSelf();
      }, AUTO_HIDE_MS);
    });

    return () => {
      unlisten.then((f) => f());
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const handleMouseEnterDismiss = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideSelf();
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div
        onMouseEnter={handleMouseEnterDismiss}
        style={{
          background: "#FF4757",
          border: "4px solid #1E293B",
          borderRadius: "24px",
          padding: "32px 24px",
          textAlign: "center",
          width: "380px",
          boxShadow: "0px 15px 30px rgba(0, 0, 0, 0.2), 8px 8px 0px #1E293B",
          cursor: "pointer",
          userSelect: "none",
          animation: "warningBounce 0.8s infinite alternate ease-in-out",
          boxSizing: "border-box",
        }}
      >
        <h1
          style={{
            margin: "0 0 12px 0",
            color: "#FFFFFF",
            fontSize: "28px",
            fontWeight: "900",
            letterSpacing: "1px",
            textShadow: "2px 2px 0px #1E293B",
          }}
        >
          Quay lại làm việc nào! 🚨
        </h1>

        <p
          style={{
            margin: "0 0 24px 0",
            color: "#FFFFFF",
            fontSize: "15px",
            fontWeight: "bold",
            lineHeight: "1.5",
          }}
        >
          {message}
        </p>

        <div
          style={{
            display: "inline-block",
            background: "#1E293B",
            color: "#FFFFFF",
            fontSize: "13px",
            padding: "8px 16px",
            borderRadius: "12px",
            fontWeight: "bold",
            letterSpacing: "0.5px",
          }}
        >
          👋 Quẹt chuột vào đây để quay lại
        </div>
      </div>

      <style>{`
        @keyframes warningBounce {
          from { transform: translateY(0px); }
          to { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}