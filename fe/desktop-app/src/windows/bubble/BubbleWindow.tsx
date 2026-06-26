import { useEffect, useState } from "react";
import { listen, emit } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { ChatBubble } from "../../shared/components/ChatBubble";
import { useFocusStore } from "../../features/focus-session/stores/focusStore";

export default function BubbleWindow() {
  const [isWidgetActive, setIsWidgetActive] = useState(true);

  const [breakPrompt, setBreakPrompt] = useState<{
    isOpen: boolean;
    startedAtMs: number | null;
    durationSeconds: number;
    countdown: number;
  }>({ isOpen: false, startedAtMs: null, durationSeconds: 60, countdown: 60 });

  const { botMessage, botActions, isBubbleVisible } = useFocusStore();

  // ── LẮNG NGHE TRẠNG THÁI ACTIVE/INACTIVE CỦA WIDGET ──
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

  // ── LẮNG NGHE TÍN HIỆU MỞ/ĐÓNG TỪ MAIN WINDOW ──
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

  // ── LẮNG NGHE CẬP NHẬT MESSAGE/ACTIONS TỪ MAIN WINDOW ──
  useEffect(() => {
    const unlistenBubble = listen<{
      message: string | null;
      actions: any[] | undefined;
      isVisible: boolean;
    }>("bot-bubble-update", (event) => {
      useFocusStore.setState({
        botMessage: event.payload.message,
        botActions: event.payload.actions,
        isBubbleVisible: event.payload.isVisible,
      });
    });

    return () => {
      unlistenBubble.then((f) => f());
    };
  }, []);

  // ── TỰ ĐỘNG TÍNH LÙI THEO MỐC THỜI GIAN TUYỆT ĐỐI ──
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

  // ── SHOW/HIDE WINDOW THEO TRẠNG THÁI HIỂN THỊ ──
  const finalVisibility =
    isWidgetActive && (breakPrompt.isOpen ? true : !!isBubbleVisible); // 👈 thêm điều kiện isWidgetActive

  useEffect(() => {
    const win = getCurrentWebviewWindow();
    if (finalVisibility) {
      win.show().catch((err) => console.error("Bubble show error:", err));
    } else {
      win.hide().catch((err) => console.error("Bubble hide error:", err));
    }
  }, [finalVisibility]);

  const finalMessage = botMessage || "";

  const finalActions =
    breakPrompt.isOpen && botActions && botActions.length >= 2
      ? [
          {
            ...botActions[0],
            onClick: () => emit("widget-click-accept-break"),
          },
          {
            ...botActions[1],
            onClick: () => emit("widget-click-reject-break"),
          },
        ]
      : botActions?.map((action) => ({
          ...action,
          onClick: () => {
            useFocusStore.setState({ isBubbleVisible: false });
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
