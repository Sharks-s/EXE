import { useEffect, useState } from "react";
import { listen, emit } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { ChatBubble } from "@/shared/components/ChatBubble";


interface BubbleContent {
  message: string | null;
  actions: any[] | undefined;
  isVisible: boolean;
}

export default function BubbleWindow() {
  const [isWidgetActive, setIsWidgetActive] = useState(true);

  // Quản lý nội dung hiển thị của Bubble hoàn toàn qua local state nhận từ Event
  const [bubbleContent, setBubbleContent] = useState<BubbleContent>({
    message: null,
    actions: undefined,
    isVisible: false,
  });

  const [breakPrompt, setBreakPrompt] = useState<{
    isOpen: boolean;
    startedAtMs: number | null;
    durationSeconds: number;
    countdown: number;
  }>({ isOpen: false, startedAtMs: null, durationSeconds: 60, countdown: 60 });

  // ── 1. LẮNG NGHE TRẠNG THÁI ACTIVE/INACTIVE CỦA WIDGET ──
  useEffect(() => {
    const unlistenActive = listen<{ active: boolean }>(
      "widget-active-state",
      (event) => {
        setIsWidgetActive(event.payload.active);
      },
    );
    return () => {
      unlistenActive.then((f) => f());
    };
  }, []);

  // ── 2. LẮNG NGHE TÍN HIỆU MỞ/ĐÓNG POPUP HỎI NGHỈ ──
  useEffect(() => {
    const unlistenPrompt = listen<{
      isOpen: boolean;
      startedAtMs?: number;
      durationSeconds?: number;
    }>("tauri-break-prompt", (event) => {
      if (event.payload.isOpen) {
        setBreakPrompt({
          isOpen: true,
          startedAtMs: event.payload.startedAtMs ?? Date.now(),
          durationSeconds: event.payload.durationSeconds ?? 60,
          countdown: event.payload.durationSeconds ?? 60,
        });
      } else {
        setBreakPrompt({
          isOpen: false,
          startedAtMs: null,
          durationSeconds: 60,
          countdown: 60,
        });
      }
    });

    return () => {
      unlistenPrompt.then((f) => f());
    };
  }, []);

  // ── 3. LẮNG NGHE CẬP NHẬT CÂU THOẠI AI (Đồng bộ trực tiếp vào local state) ──
  useEffect(() => {
    const unlistenBubble = listen<BubbleContent>(
      "bot-bubble-update",
      (event) => {
        setBubbleContent({
          message: event.payload.message,
          actions: event.payload.actions,
          isVisible: event.payload.isVisible,
        });
      },
    );

    return () => {
      unlistenBubble.then((f) => f());
    };
  }, []);

  // ── 4. TỰ ĐỘNG TÍNH LÙI THEO MỐC THỜI GIAN TUYỆT ĐỐI ──
  useEffect(() => {
    if (!breakPrompt.isOpen || !breakPrompt.startedAtMs) return;

    const timer = setInterval(() => {
      const elapsedSeconds = Math.floor(
        (Date.now() - breakPrompt.startedAtMs!) / 1000,
      );
      const remaining = breakPrompt.durationSeconds - elapsedSeconds;

      if (remaining <= 0) {
        setBreakPrompt({
          isOpen: false,
          startedAtMs: null,
          durationSeconds: 60,
          countdown: 60,
        });
      } else {
        setBreakPrompt((prev) => ({ ...prev, countdown: remaining }));
      }
    }, 500);

    return () => clearInterval(timer);
  }, [
    breakPrompt.isOpen,
    breakPrompt.startedAtMs,
    breakPrompt.durationSeconds,
  ]);

  // ── 5. QUYẾT ĐỊNH ẨN / HIỆN WINDOW CHUẨN XÁC ──
  // Cửa sổ hiện khi: Widget đang active VÀ (đang trong trạng thái prompt hỏi nghỉ HOẶC AI đang hiển thị lời thoại)
  const finalVisibility =
    isWidgetActive && (breakPrompt.isOpen || bubbleContent.isVisible);

  useEffect(() => {
    const win = getCurrentWebviewWindow();
    if (finalVisibility) {
      win
        .show()
        .then(() => win.setFocus())
        .catch((err) => console.error("Bubble show error:", err));
    } else {
      win.hide().catch((err) => console.error("Bubble hide error:", err));
    }
  }, [finalVisibility]);

  // ── 6. XỬ LÝ ACTIONS (Nút bấm) TRÁNH LỆCH PHA DỮ LIỆU ──
  const finalMessage = bubbleContent.message || "";

  const finalActions =
    breakPrompt.isOpen &&
    bubbleContent.actions &&
    bubbleContent.actions.length >= 2
      ? [
          {
            ...bubbleContent.actions[0],
            label: `${bubbleContent.actions[0].label} (${breakPrompt.countdown}s)`, // Hiển thị đếm ngược lên nút bấm nghỉ ngơi nếu muốn
            onClick: () => emit("widget-click-accept-break"),
          },
          {
            ...bubbleContent.actions[1],
            onClick: () => emit("widget-click-reject-break"),
          },
        ]
      : bubbleContent.actions?.map((action) => ({
          ...action,
          onClick: () => {
            setBubbleContent((prev) => ({ ...prev, isVisible: false }));
          },
        })) || undefined;

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        justifyContent: "flex-end",
        background: "transparent",
        userSelect: "none",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <ChatBubble
        message={finalMessage}
        isVisible={true}
        actions={finalActions}
      />
    </div>
  );
}
