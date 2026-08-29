import React from "react";
import { useTranslation } from "react-i18next";

interface BreakPromptPopupProps {
  isOpen: boolean;
  countdown: number;
  onAccept: () => void;
  onReject: () => void;
}

export const BreakPromptPopup: React.FC<BreakPromptPopupProps> = ({
  isOpen,
  countdown,
  onAccept,
  onReject,
}) => {
  const { t } = useTranslation("common");

  // Nếu không ở trạng thái mở thì không render gì cả
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(30, 41, 59, 0.75)", // Làm tối nền
        backdropFilter: "blur(4px)", // Làm mờ nhẹ nền đằng sau
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999, // Luôn luôn nằm trên cùng
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          border: "4px solid #1E293B",
          borderRadius: "24px",
          padding: "24px",
          width: "100%",
          maxWidth: "310px",
          boxShadow: "8px 8px 0px #1E293B",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          animation: "popupScaleIn 0.2s ease-out",
        }}
      >
        {/* Tiêu đề */}
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "900",
            color: "#1E293B",
            margin: 0,
          }}
        >
          {t("focusSession.breakPrompt.title")}
        </h2>

        {/* Nội dung hỏi */}
        <p
          style={{
            fontSize: "13px",
            color: "#475569",
            fontWeight: "600",
            lineHeight: "1.5",
            margin: 0,
          }}
        >
          {t("focusSession.breakPrompt.message")}
        </p>

        {/* Thời gian đếm ngược tự đóng */}
        <div
          style={{
            fontSize: "12px",
            backgroundColor: "#FEE2E2",
            color: "#EF4444",
            padding: "6px 12px",
            borderRadius: "20px",
            fontWeight: "800",
            display: "inline-block",
            margin: "4px auto",
          }}
        >
          {t("focusSession.breakPrompt.auto_skip", { seconds: countdown })}
        </div>

        {/* Bộ đôi nút bấm hành động */}
        <div style={{ display: "flex", gap: "12px", marginTop: "6px" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAccept();
            }}
            style={{
              flex: 1,
              padding: "12px 0",
              borderRadius: "12px",
              border: "3px solid #1E293B",
              background: "#10B981", // Màu xanh lá kích thích bấm nghỉ
              color: "#FFFFFF",
              fontSize: "13px",
              fontWeight: "800",
              cursor: "pointer",
              boxShadow: "3px 3px 0px #1E293B",
            }}
          >
            {t("focusSession.breakPrompt.accept_button")}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onReject();
            }}
            style={{
              flex: 1,
              padding: "12px 0",
              borderRadius: "12px",
              border: "3px solid #1E293B",
              background: "#FFFFFF",
              color: "#1E293B",
              fontSize: "13px",
              fontWeight: "800",
              cursor: "pointer",
              boxShadow: "3px 3px 0px #1E293B",
            }}
          >
            {t("focusSession.breakPrompt.reject_button")}
          </button>
        </div>
      </div>

      {/* Animation nhỏ cho popup mượt mà */}
      <style>{`
        @keyframes popupScaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};