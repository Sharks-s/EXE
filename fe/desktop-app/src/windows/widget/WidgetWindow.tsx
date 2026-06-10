import { useEffect, useRef, useState } from "react";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

// Cấu hình cho 10 frame của bạn
const FRAME_COUNT = 10;
const ANIMATION_SPEED_FPS = 10; // Tốc độ chạy (12 hình trên 1 giây, bạn có thể chỉnh lại cho vừa mắt)

// Hàm lấy đường dẫn ảnh từ thư mục public/frames mà bạn vừa xếp lúc nãy
const getFramePath = (index: number) => `/monkeyFrames/bot_${index}.png`;

export default function WidgetWindow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentFrameRef = useRef(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [isReady, setIsReady] = useState(false);

  // 1. Tải trước (Pre-load) toàn bộ 10 ảnh vào RAM để khi chạy không bị nhấp nháy
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
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);

  // 2. Vòng lặp vẽ ảnh lên Canvas (Giữ nguyên độ xóa phông của PNG)
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

        // Xóa sạch khung cũ để vẽ khung mới (giúp giữ độ trong suốt, không bị đè hình)
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const imgToDraw = images[currentFrameRef.current];

        if (imgToDraw) {
          const imgWidth = imgToDraw.width;
          const imgHeight = imgToDraw.height;

          // Tính toán tỷ lệ để ảnh vừa khít trong ô vuông 160x160 của cửa sổ
          const scale = Math.min(
            canvas.width / imgWidth,
            canvas.height / imgHeight,
          );
          const dWidth = imgWidth * scale;
          const dHeight = imgHeight * scale;

          // Căn giữa hình ảnh vào tâm Canvas
          const dx = (canvas.width - dWidth) / 2;
          const dy = (canvas.height - dHeight) / 2;

          ctx.drawImage(imgToDraw, dx, dy, dWidth, dHeight);
        }

        // Lặp vòng từ 0 đến 9
        currentFrameRef.current = (currentFrameRef.current + 1) % FRAME_COUNT;
      }

      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    animationFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isReady, images]);

  // 3. Click chuột vào con Bot để thu nhỏ quay về Dashboard chính
  const handleClick = async () => {
    const mainWindow = await WebviewWindow.getByLabel("main");
    const widgetWindow = await WebviewWindow.getByLabel("widget");
    if (!mainWindow || !widgetWindow) return;
    await mainWindow.show();
    await widgetWindow.hide();
  };

  return (
    <div
      onClick={handleClick}
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent", // Giữ trong suốt để không hiện background nền trắng sau widget
        cursor: "pointer",
        userSelect: "none",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        width={160} // Kích thước pixel vật lý để vẽ vẽ ảnh sắc nét
        height={160}
        style={{
          width: 140, // Kích thước hiển thị thực tế (nhỏ hơn viền cửa sổ một tí cho đẹp)
          height: 140,
          // border: "2px solid red",
          background: "transparent", // Đảm bảo canvas trong suốt
        }}
      />

      {!isReady && (
        <div style={{ position: "absolute", fontSize: 14, color: "#0284C7" }}>
          Loading Bot...
        </div>
      )}
    </div>
  );
}
