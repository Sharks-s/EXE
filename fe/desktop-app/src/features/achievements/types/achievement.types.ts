export type AchievementCategory =
  | "SESSION"
  | "FOCUS_TIME"
  | "STREAK"
  | "MILESTONE"
  | "BEHAVIORAL";

export type AchievementRarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

export type AchievementStatus = "LOCKED" | "IN_PROGRESS" | "UNLOCKED";

export interface Achievement {
  id: number;
  code: string;
  name: string;
  description: string | null;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  targetValue: number;
  rewardPoints: number;
  progress: number;
  status: AchievementStatus;
  unlockedAt: string | null;
}

export interface UnlockedAchievement {
  code: string;
  name: string;
  rewardPoints: number;
}
