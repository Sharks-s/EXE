import { useRef, useCallback } from "react";

const MIN_DURATION = 25;
const MAX_DURATION = 480;
const ACCENT = "#2563eb";

interface SliderTrackProps {
  value: number;
  onChange: (value: number) => void;
}

export function SliderTrack({ value, onChange }: SliderTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const clamp = (v: number) =>
    Math.min(MAX_DURATION, Math.max(MIN_DURATION, v));

  const pct = ((value - MIN_DURATION) / (MAX_DURATION - MIN_DURATION)) * 100;

  const getValueFromEvent = useCallback(
    (clientX: number) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return value;
      const ratio = (clientX - rect.left) / rect.width;
      const raw = MIN_DURATION + ratio * (MAX_DURATION - MIN_DURATION);
      return clamp(Math.round(raw / 5) * 5); // Làm tròn nhảy nấc mỗi 5 phút
    },
    [value],
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    onChange(getValueFromEvent(e.clientX));
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons === 0) return;
    onChange(getValueFromEvent(e.clientX));
  };

  return (
    <div style={{ position: "relative", padding: "14px 0" }}>
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        style={{
          height: 6,
          borderRadius: 99,
          background: "#E2E8F0",
          cursor: "pointer",
          position: "relative",
          userSelect: "none",
        }}
      >
        {/* Tiến trình thanh trượt màu xanh */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${pct}%`,
            borderRadius: 99,
            background: `linear-gradient(90deg, ${ACCENT} 0%, #3B82F6 100%)`,
            transition: "width 0.05s",
          }}
        />
        {/* Nút tròn kéo tay */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: `${pct}%`,
            transform: "translate(-50%, -50%)",
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: `0 0 0 4px #fff, 0 0 0 6px ${ACCENT}, 0 4px 12px rgba(37,99,235,0.2)`,
            cursor: "grab",
            transition: "left 0.05s",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 10,
        }}
      >
        <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500 }}>
          25 phút
        </span>
        <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500 }}>
          8 giờ
        </span>
      </div>
    </div>
  );
}
