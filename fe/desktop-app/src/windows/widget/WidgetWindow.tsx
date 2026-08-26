import { useEffect, useRef, useState } from "react";
import { listen, emit } from "@tauri-apps/api/event";
import {
  WebviewWindow,
  getCurrentWebviewWindow,
} from "@tauri-apps/api/webviewWindow";

const ANIMATION_SPEED_FPS = 10;

const ACTION_FRAME_COUNTS: Record<string, number> = {
  sleep: 10,
  question: 10,
  remind: 10,
  posture: 9,
  angry: 10,
  working: 9,
};

const BACKGROUND_ACTIONS = ["working", "sleep"] as const;
const BACKGROUND_INTERVAL_MS = 60_000;

export default function WidgetWindow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentFrameRef = useRef(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [petCode, setPetCode] = useState<string>("monkey");
  const [backgroundAction, setBackgroundAction] = useState<string>(
    BACKGROUND_ACTIONS[0],
  );
  const [overrideAction, setOverrideAction] = useState<string | null>(null);

  const currentAction = overrideAction ?? backgroundAction;
  const frameCount = ACTION_FRAME_COUNTS[currentAction] ?? 10;

  useEffect(() => {
    const unlisten = listen<{ petCode: string }>(
      "widget-pet-update",
      (event) => {
        setPetCode(event.payload.petCode.trim());
      },
    );
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const getFramePath = (index: number) =>
    `/pet/${petCode}/${currentAction}/bot_${index}.png`;

  // ── TẦNG NỀN: luân phiên work/sleep mỗi 1 phút ──
  useEffect(() => {
    const interval = setInterval(() => {
      setBackgroundAction((prev) =>
        prev === BACKGROUND_ACTIONS[0]
          ? BACKGROUND_ACTIONS[1]
          : BACKGROUND_ACTIONS[0],
      );
    }, BACKGROUND_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // ── TẦNG OVERRIDE: nhận action từ main qua bot-bubble-update ──
  useEffect(() => {
    const unlisten = listen<{
      action?: string;
      isVisible: boolean;
    }>("bot-bubble-update", (event) => {
      if (event.payload.isVisible && event.payload.action) {
        setOverrideAction(event.payload.action);
      } else {
        setOverrideAction(null);
      }
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  // ── PRELOAD FRAMES ─────────────────────────────────
  useEffect(() => {
    const loadedImages: HTMLImageElement[] = [];
    let loadedCount = 0;
    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.src = getFramePath(i);
      img.onload = () => {
        loadedCount++;
        if (loadedCount === frameCount) {
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
  }, [petCode, currentAction, frameCount]); // 👈 thêm frameCount vào deps cho chính xác

  // ── ANIMATION LOOP ─────────────────────────────────
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
        currentFrameRef.current = (currentFrameRef.current + 1) % frameCount;
      }
      animationFrameIdRef.current = requestAnimationFrame(animate);
    };
    animationFrameIdRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameIdRef.current)
        cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [isReady, images, frameCount]);

  // ── CLICK VÀO CHÚ KHỈ → QUAY LẠI DASHBOARD ──
  const handleClick = async () => {
    const currentWin = getCurrentWebviewWindow();
    console.log("[WidgetWindow] click on:", currentWin.label);
    const mainWindow = await WebviewWindow.getByLabel("main");
    const widgetWindow = await WebviewWindow.getByLabel("widget");
    const bubbleWindow = await WebviewWindow.getByLabel("widget-bubble");
    if (!mainWindow || !widgetWindow) return;
    try {
      await mainWindow.show();
      await emit("widget-active-state", { active: false });
      await widgetWindow?.hide();
      await bubbleWindow?.hide();
    } catch (err) {
      console.error(err);
    }
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
        userSelect: "none",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        width={160}
        height={160}
        style={{
          width: 130,
          height: 130,
          background: "transparent",
          cursor: "pointer",
        }}
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
