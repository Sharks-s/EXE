import React from "react";

interface ChatBubbleAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

interface ChatBubbleProps {
  message: string;
  isVisible: boolean;
  actions?: ChatBubbleAction[];
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isVisible,
  actions,
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
          wordBreak: "break-word",
          boxShadow: "4px 4px 0px #1E293B",
          color: "#1E293B",
          fontSize: "12px",
          fontWeight: "bold",
          textAlign: "center",
          lineHeight: "1.4",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <span>{message}</span>

        {actions && actions.length > 0 && (
          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={(e) => {
                  e.stopPropagation(); // không trigger handleClick của widget
                  action.onClick();
                }}
                style={{
                  flex: 1,
                  padding: "5px 0",
                  borderRadius: 8,
                  border: "2px solid #1E293B",
                  background:
                    action.variant === "primary" ? "#1E293B" : "#FFFFFF",
                  color: action.variant === "primary" ? "#FFFFFF" : "#1E293B",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow:
                    action.variant === "primary"
                      ? "none"
                      : "2px 2px 0px #1E293B",
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Đuôi viền đen */}
      <div
        style={{
          position: "absolute",
          bottom: "-13px",
          left: "auto",
          right: "45px",
          width: "16px",
          height: "16px",
          background: "#1E293B",
          clipPath: "polygon(0 0, 100% 0, 30% 100%)",
        }}
      />

      {/* Đuôi ruột trắng */}
      <div
        style={{
          position: "absolute",
          bottom: "-9px",
          left: "auto",
          right: "48px",
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
