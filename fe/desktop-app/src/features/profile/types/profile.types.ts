export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface SaveProfileRequest {
  fullName: string;
  phoneNumber?: string;
  gender: Gender;
  dateOfBirth?: string;
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
  dateOfBirth?: string;
  personalityId?: string;
}

export interface ProfileCompletionResponse {
  completed: boolean;
  missingFields?: string[];
}