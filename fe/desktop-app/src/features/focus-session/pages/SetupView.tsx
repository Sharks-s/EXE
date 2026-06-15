import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CameraSetupModal } from "../components/CameraSetupModal";
import { SliderTrack } from "../components/SideTrack";
import type { GoalPresetItem } from "../types/focus.types";
import "./SetupView.css";

const PRESET_GOALS: GoalPresetItem[] = [
  { key: "coding", labelKey: "common:goals.coding" },
  { key: "assignment", labelKey: "common:goals.assignment" },
  { key: "study", labelKey: "common:goals.study" },
  { key: "meeting", labelKey: "common:goals.meeting" },
  { key: "writing", labelKey: "common:goals.writing" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

// Render hiển thị chuỗi thời gian thân thiện
function formatDuration(min: number) {
  if (min < 60) return `${min} phút`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} giờ` : `${h}g ${m}p`;
}

function getBreakBank(min: number) {
  const rounds = Math.floor(min / 25);
  return { rounds, minutes: rounds * 5 };
}

export function SetupView() {
  const { t } = useTranslation("common");

  const [selectedPreset, setSelectedPreset] = useState<string | null>("coding");
  const [customGoal, setCustomGoal] = useState("");
  const [duration, setDuration] = useState(50);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const { rounds, minutes: breakMinutes } = getBreakBank(duration);

  const resolvedGoal =
    customGoal.trim() ||
    t(`goals.${selectedPreset}`, { defaultValue: selectedPreset ?? "" });

  return (
    <div className="container">
      {/* SIMPLE GREETING HEADER */}
      <div className="header">
        <h1 className="title">{getGreeting()} 👋</h1>
        <p className="subtitle">
          Thiết lập mục tiêu và thời gian để bắt đầu phiên làm việc.
        </p>
      </div>

      {/* GOAL SECTION */}
      <div>
        <label className="sectionLabel">Hôm nay bạn cần làm gì?</label>
        <div className="presetContainer">
          {PRESET_GOALS.map((g) => {
            const isSelected = selectedPreset === g.key && !customGoal;
            return (
              <button
                key={g.key}
                onClick={() => {
                  setSelectedPreset(g.key);
                  setCustomGoal("");
                }}
                className={`presetBtn ${isSelected ? "presetBtnActive" : ""}`}
              >
                {t(`goals.${g.key}`, { defaultValue: g.key })}
              </button>
            );
          })}
        </div>
        <input
          type="text"
          placeholder="Hoặc nhập mục tiêu cụ thể..."
          value={customGoal}
          onChange={(e) => {
            setCustomGoal(e.target.value);
            setSelectedPreset(null);
          }}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          className={`customInput ${inputFocused ? "customInputFocused" : ""}`}
        />
      </div>

      {/* DURATION SECTION */}
      <div>
        <div className="durationHeader">
          <label className="sectionLabel">Thời gian phiên</label>
          <div className="durationBadge">{formatDuration(duration)}</div>
        </div>

        {/* Thanh trượt đã tách component */}
        <SliderTrack value={duration} onChange={setDuration} />

        <div className="quickTimeContainer">
          {[25, 50, 90, 120].map((m) => (
            <button
              key={m}
              onClick={() => setDuration(m)}
              className={`quickTimeBtn ${duration === m ? "quickTimeBtnActive" : ""}`}
            >
              {m}p
            </button>
          ))}
        </div>
      </div>

      {/* BREAK BANK PREVIEW */}
      <div className="breakBankCard">
        <div className="breakBankIcon">💰</div>
        <div>
          <div className="breakBankTitle">+{breakMinutes} phút break bank</div>
          <div className="breakBankSubtitle">
            {rounds} hiệp × 5 phút — hoàn thành để tích luỹ
          </div>
        </div>
      </div>

      <button onClick={() => setIsCameraOpen(true)} className="submitBtn">
        Bắt đầu tập trung →
      </button>

      {isCameraOpen && (
        <CameraSetupModal
          goal={resolvedGoal}
          durationMinutes={duration}
          onClose={() => setIsCameraOpen(false)}
        />
      )}
    </div>
  );
}
