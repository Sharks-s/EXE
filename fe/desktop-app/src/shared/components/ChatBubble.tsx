import React from "react";

interface ChatBubbleProps {
  message: string;
  isVisible: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isVisible,
}) => {
  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginBottom: "16px",
        animation: "bubbleBounce 2s infinite ease-in-out",
        width: "100%",
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          border: "3px solid #1E293B",
          borderRadius: "16px",
          padding: "10px 14px",

          width: "max-content",
          maxWidth: "160px",
          boxSizing: "border-box",
          wordBreak: "break-word", // Chống tràn chữ ra ngoài viền

          // Đổ bóng khối đặc biệt kiểu Comic giống ảnh mẫu
          boxShadow: "4px 4px 0px #1E293B",

          color: "#1E293B",
          fontSize: "12px",
          fontWeight: "bold",
          textAlign: "center",
          lineHeight: "1.4",
        }}
      >
        {message}
      </div>

      {/* 📐 Cái Đuôi Nhọn Comic Xiên Chéo */}
      {/* 1. Lớp đuôi màu đen nằm dưới làm viền */}
      <div
        style={{
          position: "absolute",
          bottom: "-13px",

          // 🔥 THAY ĐỔI Ở ĐÂY: Bỏ left, dùng right để găm đuôi cố định từ lề phải vào
          left: "auto",
          right: "45px", // Thử 45px hoặc 50px để canh đúng đỉnh đầu khỉ bên dưới

          width: "16px",
          height: "16px",
          background: "#1E293B",
          clipPath: "polygon(0 0, 100% 0, 30% 100%)",
        }}
      />

      {/* 2. Lớp đuôi màu trắng nằm đè lên trên để làm ruột */}
      <div
        style={{
          position: "absolute",
          bottom: "-9px",

          // 🔥 THAY ĐỔI ĐỒNG BỘ Ở ĐÂY:
          left: "auto",
          right: "48px", // Nhỏ hơn lớp viền đen 3px để tạo khoảng viền đều

          width: "10px",
          height: "12px",
          background: "#FFFFFF",
          clipPath: "polygon(0 0, 100% 0, 30% 100%)",
        }}
      />

      <style>{`
        @keyframes bubbleBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};
