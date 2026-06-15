import { useEffect, useRef, useState } from "react";
import {
  WebviewWindow,
  getCurrentWebviewWindow,
} from "@tauri-apps/api/webviewWindow";
import { ChatBubble } from "../../shared/components/ChatBubble";
import { useFocusStore } from "../../features/focus-session/stores/focusStore";
import { focusApi } from "../../features/focus-session/api/focus.api";

const FRAME_COUNT = 10;
const ANIMATION_SPEED_FPS = 10;
const getFramePath = (index: number) => `/monkeyFrames/bot_${index}.png`;

export default function WidgetWindow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentFrameRef = useRef(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleMessage, setBubbleMessage] = useState("");
  const [bubbleMode, setBubbleMode] = useState<"cycle" | "warning" | null>(
    null,
  );

  const { session, syncSession } = useFocusStore();

  // ── Preload frames ─────────────────────────────────
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

  // ── Animation loop ─────────────────────────────────
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

  // ── Cycle timer trigger ────────────────────────────
  useEffect(() => {
    if (!session) return;

    const lastCycleAt = session.lastCycleAt
      ? new Date(session.lastCycleAt).getTime()
      : new Date(session.startedAt).getTime();

    const cycleEndAt = lastCycleAt + 25 * 60 * 1000;
    const delay = cycleEndAt - Date.now();

    if (delay <= 0) {
      // Đã quá 25 phút rồi → gọi luôn
      handleCycleComplete();
      return;
    }

    // Chưa đủ 25 phút → đặt timeout đúng lúc
    const timeout = setTimeout(() => {
      handleCycleComplete();
    }, delay);

    return () => clearTimeout(timeout);
  }, [session?.lastCycleAt]); // re-run mỗi khi lastCycleAt đổi (sau mỗi cycle)

  // ── Cycle complete handler ─────────────────────────
  const handleCycleComplete = async () => {
    if (!session) return;
    try {
      const res = await focusApi.completeCycle(session.id);
      syncSession(res);
      setBubbleMessage("Hiệp xong! 🎉 Nghỉ xíu hay cày tiếp?");
      setBubbleMode("cycle");
      setShowBubble(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBreak = () => {
    setBubbleMessage("Nghỉ 5 phút nhé! ☕ Quay lại đúng giờ đó!");
    setBubbleMode(null);
    setTimeout(() => setShowBubble(false), 4000);
  };

  const handleContinue = () => {
    setShowBubble(false);
    setBubbleMode(null);
  };

  // ── Click bot → back to dashboard ─────────────────
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

  // ── Bubble actions theo mode ───────────────────────
  const bubbleActions =
    bubbleMode === "cycle"
      ? [
          {
            label: "Nghỉ ☕",
            onClick: handleBreak,
            variant: "secondary" as const,
          },
          {
            label: "Tiếp! 🔥",
            onClick: handleContinue,
            variant: "primary" as const,
          },
        ]
      : undefined;

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
        message={bubbleMessage}
        isVisible={showBubble}
        actions={bubbleActions}
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
