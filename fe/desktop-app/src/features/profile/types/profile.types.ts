export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface SaveProfileRequest {
  fullName: string;
  phoneNumber?: string;
  gender: Gender;
  dateOfBirth?: string;
  dob?: string;
  personalityId?: number;
  addressLine?: string;
  provinceCode?: number;
  wardCode?: number;
}

export interface UpdateAvatarRequest {
  avatar: File;

}

export interface UserSummary {
  id: number;
  email?: string;
  fullName: string;
  avatarUrl?: string;
  phoneNumber?: string;
  addressLine?: string | null;
  provinceCode?: number | null;
  provinceName?: string | null;
  wardCode?: number | null;
  wardName?: string | null;
  gender: Gender;
  dob?: string | null;
  createdAt?: string;
  passwordUpdatedAt?: string;
  dateOfBirth?: string | null;
  profileCompleted?: boolean;
  personalityId?: number | string;
  personalityCode?: string | null;
  roles?: string[];
  aiSelfAddress?: string | null;
  aiUserAddress?: string | null;
}

export interface ProfileCompletionResponse {
  completed?: boolean;
  profileCompleted?: boolean;
  profile_completed?: boolean;
  missingFields?: string[];
}

export interface DailyUsageResponse {
  dailyUsedMinute: number;
  dailyLimitMinute: number;
  remainingMinute: number;
}

export interface LocationOption {
  code: number;
  codeName: string;
  name: string;
}
