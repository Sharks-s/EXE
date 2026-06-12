import { useEffect, useRef, useState } from "react";
import {
  WebviewWindow,
  getCurrentWebviewWindow,
} from "@tauri-apps/api/webviewWindow";
import { ChatBubble } from "../../shared/components/ChatBubble";

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
  const [botMessage, setBotMessage] = useState<string>(
    "Ủa cái điện thoại có dính vàng hay sao mà nhìn hoài vậy bạn? Trừ 2 phút nghỉ nhé, bớt nhìn lại!",
  );
  const [showBubble, setShowBubble] = useState<boolean>(true);

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
    // 🎯 LOG 1: Xem thực chất nút click này đang chạy trên CỬA SỔ NÀO
    const currentWin = getCurrentWebviewWindow();
    console.log(
      "[WidgetWindow] 🛑 Cú click chuột xảy ra trên CỬA SỔ CÓ LABEL:",
      currentWin.label,
    );

    const mainWindow = await WebviewWindow.getByLabel("main");
    const widgetWindow = await WebviewWindow.getByLabel("widget");

    // 🎯 LOG 2: Kiểm tra xem các thực thể cửa sổ có tìm thấy không
    console.log("[WidgetWindow] Kiểm tra thực thể cửa sổ tìm kiếm:");
    console.log("- mainWindow:", mainWindow ? "Tìm thấy" : "NULL");
    console.log("- widgetWindow:", widgetWindow ? "Tìm thấy" : "NULL");

    if (!mainWindow || !widgetWindow) {
      console.log(
        "[WidgetWindow] ↩️ Hàm bị RETURN vì không tìm thấy đủ 2 cửa sổ trên!",
      );
      return;
    }

    try {
      await mainWindow.show();
      await widgetWindow.hide();
    } catch (err) {
      console.error("[WidgetWindow] Lỗi khi chuyển đổi cửa sổ:", err);
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
        // border: "1px solid #ff2828",
        background: "transparent",
        cursor: "pointer",
        userSelect: "none",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* 1. Bong bóng thoại tự flex co giãn nằm ở phía trên */}
      <ChatBubble message={botMessage} isVisible={showBubble} />

      {/* 2. Canvas vẽ chú khỉ nằm ở phía dưới */}
      <canvas
        ref={canvasRef}
        width={160} // Giữ nguyên độ phân giải vật lý
        height={160}
        style={{
          width: 130, // Khuyên dùng 130 hoặc 140 để cân đối tỉ lệ với khung cửa sổ 200x240
          height: 130,
          background: "transparent",
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
