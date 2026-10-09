import { useEffect, useRef, useState } from "react";
import { listen, emit } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { invoke } from "@tauri-apps/api/core";


const ANIMATION_SPEED_FPS = 10;
const DRAG_THRESHOLD = 4; // px
const CLICK_TIME_MAX = 500; // ms

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
  const dragStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const didDragRef = useRef(false);

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
  const handleReturnToDashboard = async () => {
    try {
      await invoke("restore_main_window");
      await emit("widget-active-state", { active: false });
    } catch (err) {
      console.error(err);
    }
  };

  const handleMouseDown = async (e: React.MouseEvent) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    didDragRef.current = false;

    if (e.button === 0) {
      try {
        await getCurrentWebviewWindow().startDragging();
        didDragRef.current = true; // startDragging() chỉ thực sự move nếu user kéo tay
      } catch (err) {
        console.error("[WidgetWindow] startDragging lỗi:", err);
      }
    }
  };

  // ── MOUSEUP: nếu gần như không di chuyển & nhanh -> coi là click thật ──
  const handleMouseUp = async (e: React.MouseEvent) => {
    if (!dragStartRef.current) return;
    const dx = Math.abs(e.clientX - dragStartRef.current.x);
    const dy = Math.abs(e.clientY - dragStartRef.current.y);
    const dt = Date.now() - dragStartRef.current.time;
    dragStartRef.current = null;

    if (
      e.button === 2 &&
      dx < DRAG_THRESHOLD &&
      dy < DRAG_THRESHOLD &&
      dt < CLICK_TIME_MAX
    ) {
      await handleReturnToDashboard();
    } else if (e.button === 0 && (dx >= DRAG_THRESHOLD || dy >= DRAG_THRESHOLD)) {
      // Vừa kéo xong -> báo Rust lưu vị trí + reposition bubble ngay (không chờ debounce 300ms)
      try {
        await invoke("reposition_bubble");
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleContextMenu = async (e: React.MouseEvent) => {
    e.preventDefault();
    await handleReturnToDashboard();
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
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        width={160}
        height={160}
        style={{ width: 130, height: 130, background: "transparent", cursor: "pointer" }}
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
