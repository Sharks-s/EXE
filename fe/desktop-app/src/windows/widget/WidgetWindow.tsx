import { useEffect, useRef, useState } from "react";
import {
  WebviewWindow,
  getCurrentWebviewWindow,
} from "@tauri-apps/api/webviewWindow";
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

  // 🎯 LẤY TOÀN BỘ TIN NHẮN VÀ ACTIONS TỪ STORE ĐỔ XUỐNG
  // Giả định store của bạn quản lý các biến này (hoặc bạn điều chỉnh theo tên biến thực tế trong store)
  const { botMessage, botActions, isBubbleVisible } = useFocusStore();

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

  // ── 3. CLICK VÀO CHÚ KHỈ → QUAY LẠI DASHBOARD ──────────────────────────
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
      {/* 🎯 BẢO SAO NGHE VẬY: Truyền trực tiếp data từ Store vào bong bóng */}
      <ChatBubble
        message={botMessage || ""}
        isVisible={!!isBubbleVisible}
        actions={botActions}
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
