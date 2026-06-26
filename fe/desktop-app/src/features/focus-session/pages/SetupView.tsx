import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CameraSetupModal } from "../components/CameraSetupModal";
import type { GoalPresetItem } from "../types/focus.types";
import "./SetupView.css";

const PRESET_GOALS: GoalPresetItem[] = [
  { key: "coding", labelKey: "common:goals.coding" },
  { key: "assignment", labelKey: "common:goals.assignment" },
  { key: "study", labelKey: "common:goals.study" },
  { key: "meeting", labelKey: "common:goals.meeting" },
  { key: "writing", labelKey: "common:goals.writing" },
];

interface DurationLevel {
  minutes: number;
  label: string;
  hint: string;
  recommended?: boolean;
}

const DURATION_LEVELS: DurationLevel[] = [
  { minutes: 5, label: "Mới bắt đầu", hint: "Làm quen nhịp tập trung" },
  {
    minutes: 25,
    label: "Tập trung",
    hint: "1 vòng Pomodoro chuẩn",
    recommended: true,
  },
  { minutes: 50, label: "Sâu", hint: "2 vòng liên tiếp" },
  { minutes: 90, label: "Chuyên sâu", hint: "Việc cần mạch suy nghĩ dài" },
  { minutes: 120, label: "Bền bỉ", hint: "Tối đa cho 1 phiên" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function formatDuration(min: number) {
  if (min < 60) return `${min} phút`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} giờ` : `${h}g ${m}p`;
}

// Break bank: mỗi 25 phút làm việc hoàn thành sẽ được +5 phút nghỉ tích luỹ
function getBreakBank(min: number) {
  const rounds = Math.floor(min / 25);
  return { rounds, minutes: rounds * 5 };
}

interface LevelCardProps {
  level: DurationLevel;
  isActive: boolean;
  onSelect: () => void;
}

function LevelCard({ level, isActive, onSelect }: LevelCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`levelCard ${isActive ? "levelCardActive" : ""}`}
    >
      {level.recommended && <span className="levelBadge">Đề xuất</span>}
      <span className="levelMinutes">{formatDuration(level.minutes)}</span>
      <span className="levelLabel">{level.label}</span>
      <span className="levelHint">{level.hint}</span>
    </button>
  );
}

export function SetupView() {
  const { t } = useTranslation("common");

  const [selectedPreset, setSelectedPreset] = useState<string | null>("coding");
  const [customGoal, setCustomGoal] = useState("");
  const [duration, setDuration] = useState(25);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const { rounds, minutes: breakMinutes } = getBreakBank(duration);

  const resolvedGoal =
    customGoal.trim() ||
    t(`goals.${selectedPreset}`, { defaultValue: selectedPreset ?? "" });

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">{getGreeting()} 👋</h1>
        <p className="subtitle">Chọn mục tiêu và thời gian để bắt đầu</p>
      </div>

      {/* GOAL SECTION */}
      <div className="block">
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

      {/* DURATION / LEVEL SECTION */}
      <div className="block">
        <div className="durationHeader">
          <label className="sectionLabel">Mức độ tập trung</label>
          <div className="durationBadge">{formatDuration(duration)}</div>
        </div>

        <div className="levelGroup levelGroupShort">
          {DURATION_LEVELS.slice(0, 3).map((lvl) => (
            <LevelCard
              key={lvl.minutes}
              level={lvl}
              isActive={duration === lvl.minutes}
              onSelect={() => setDuration(lvl.minutes)}
            />
          ))}
        </div>

        <div className="levelGroup levelGroupLong">
          {DURATION_LEVELS.slice(3).map((lvl) => (
            <LevelCard
              key={lvl.minutes}
              level={lvl}
              isActive={duration === lvl.minutes}
              onSelect={() => setDuration(lvl.minutes)}
            />
          ))}
        </div>
      </div>

      {/* BREAK BANK PREVIEW */}
      <div className="breakBankCard">
        <div className="breakBankIcon">💰</div>
        <div>
          {rounds > 0 ? (
            <>
              <div className="breakBankTitle">
                Hoàn thành phiên này, bạn có {breakMinutes} phút nghỉ
              </div>
              <div className="breakBankSubtitle">
                Cứ 25 phút tập trung xong sẽ cộng thêm 5 phút nghỉ
              </div>
            </>
          ) : (
            <>
              <div className="breakBankTitle">
                Phiên ngắn, chưa cộng phút nghỉ
              </div>
              <div className="breakBankSubtitle">
                Từ 25 phút trở lên sẽ bắt đầu tích phút nghỉ
              </div>
            </>
          )}
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
