export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface SaveProfileRequest {
  fullName: string;
  phoneNumber?: string;
  gender: Gender;
  dateOfBirth?: string;
  dob?: string;
  personalityId?: number;
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
  gender: Gender;
  dob?: string | null;
  dateOfBirth?: string | null;
  profileCompleted?: boolean;
  personalityId?: number | string;
  personalityCode?: string | null;
  roles?: string[];
}

export interface ProfileCompletionResponse {
  completed: boolean;
  missingFields?: string[];
}
