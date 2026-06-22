import { useEffect, useRef, useState } from "react";
import {
  WebviewWindow,
  getCurrentWebviewWindow,
} from "@tauri-apps/api/webviewWindow";
import { listen, emit } from "@tauri-apps/api/event";
import { ChatBubble } from "../../shared/components/ChatBubble";
import { useFocusStore } from "../../features/focus-session/stores/focusStore";

const FRAME_COUNT = 10;
const ANIMATION_SPEED_FPS = 10;
const getFramePath = (index: number) => `/monkeyFrames/bot_${index}.png`;

export default function WidgetWindow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentFrameRef = useRef(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Cấu trúc lại State để hứng mốc thời gian tuyệt đối từ Main Window gửi qua
  const [breakPrompt, setBreakPrompt] = useState<{
    isOpen: boolean;
    startedAtMs: number | null;
    durationSeconds: number;
    countdown: number;
  }>({ isOpen: false, startedAtMs: null, durationSeconds: 60, countdown: 60 });

  const { botMessage, botActions, isBubbleVisible } = useFocusStore();

  // ── 🎯 LẮNG NGHE TÍN HIỆU MỞ/ĐÓNG TỪ MAIN WINDOW (KÈM MỐC THỜI GIAN THỰC) ──
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

  // ── 🎯 TỰ ĐỘNG TÍNH LÙI THEO PHÉP TRỪ MỐC TUYỆT ĐỐI (Chạy song song hoàn hảo) ────
  useEffect(() => {
    if (!breakPrompt.isOpen || !breakPrompt.startedAtMs) return;

    // Quét chu kỳ nhanh (500ms) giúp con số hiển thị khít khao mili-giây với Main Window
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

  // ── 1. PRELOAD FRAMES (Thuần hiển thị) ─────────────────────────────────
  useEffect(() => {
    const loadedImages: HTMLImageElement[] = [];
    let loadedCount = 0;
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.src = getFramePath(i);
      img.onload = () => {
        loadedCount++;
        if (loadedCount === FRAME_COUNT) {
          setImages(loadedImages);
          setIsReady(true);
        }
      };
      loadedImages.push(img);
    }
    return () => {
      if (animationFrameIdRef.current !== null)
        cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, []);

  // ── 2. ANIMATION LOOP (Thuần hiển thị) ─────────────────────────────────
  useEffect(() => {
    if (!isReady || !canvasRef.current || images.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const frameInterval = 1000 / ANIMATION_SPEED_FPS;
    let lastTime = 0;
    const animate = (timestamp: number) => {
      if (timestamp - lastTime >= frameInterval) {
        lastTime = timestamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const img = images[currentFrameRef.current];
        if (img) {
          const scale = Math.min(
            canvas.width / img.width,
            canvas.height / img.height,
          );
          const dW = img.width * scale;
          const dH = img.height * scale;
          ctx.drawImage(
            img,
            (canvas.width - dW) / 2,
            (canvas.height - dH) / 2,
            dW,
            dH,
          );
        }
        currentFrameRef.current = (currentFrameRef.current + 1) % FRAME_COUNT;
      }
      animationFrameIdRef.current = requestAnimationFrame(animate);
    };
    animationFrameIdRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameIdRef.current)
        cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [isReady, images]);

  // ── 3. CLICK VÀO CHÚ KHỈ → LUÔN CHO QUAY LẠI DASHBOARD (ĐÃ MỞ CHẶN CLICK) ──
  const handleClick = async () => {
    const currentWin = getCurrentWebviewWindow();
    console.log("[WidgetWindow] click on:", currentWin.label);
    const mainWindow = await WebviewWindow.getByLabel("main");
    const widgetWindow = await WebviewWindow.getByLabel("widget");
    if (!mainWindow || !widgetWindow) return;
    try {
      await mainWindow.show();
      await widgetWindow.hide();
    } catch (err) {
      console.error(err);
    }
  };

  // ── 🎯 CHUYỂN DỊCH TOÀN BỘ SANG TRẠNG THÁI ĐỘNG THUẦN TÚY TỪ AI/STORE ──

  // 1. Câu thoại: Thuần chữ của AI trả về từ Store, không dính số giây đếm ngược kì cục nữa
  const finalMessage = botMessage || "";

  // 2. Độ hiển thị: Cứ hễ Store bảo hiện hoặc đang mở Prompt nghỉ thì bật Bubble lên
  const finalVisibility = breakPrompt.isOpen ? true : !!isBubbleVisible;

  // 3. Nút bấm Actions:
  // Nếu đang mở Prompt nghỉ, ta giữ nguyên nhãn/style nút động của AI và map hàm onClick của hệ thống vào
  // ── 3. Nút bấm Actions: Đảm bảo mọi nút truyền vào ChatBubble đều có cấu trúc hợp lệ ──
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
          // Nếu là câu mắng vi phạm thông thường có nút (hoặc sau này ông mở rộng),
          // mặc định click vào nút đó chỉ là để tắt/clear bubble chat cho đỡ lỗi
          onClick: () => {
            // Ví dụ: click vào thì ẩn bubble chat đi
            useFocusStore.setState({ isBubbleVisible: false });
          },
        })) || undefined;

  return (
    <div
      onClick={handleClick}
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        justifyContent: "flex-end",
        background: "transparent",
        cursor: "pointer",
        userSelect: "none",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <ChatBubble
        message={finalMessage}
        isVisible={finalVisibility}
        actions={finalActions}
      />

      <canvas
        ref={canvasRef}
        width={160}
        height={160}
        style={{ width: 130, height: 130, background: "transparent" }}
      />

      {!isReady && (
        <div
          style={{
            position: "absolute",
            bottom: 20,
            fontSize: 14,
            color: "#0284C7",
          }}
        >
          Loading Bot...
        </div>
      )}
    </div>
  );
}
