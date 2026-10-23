import type { Gender } from "@/features/profile/types/profile.types";

export interface CompleteOnboardingRequest {
  fullName: string;
  phoneNumber?: string;
  gender: Gender;
  dateOfBirth?: string;
  addressLine: string;
  provinceCode: number;
  wardCode: number;
  personalityId: number;
  cameraEnabled: boolean;
}
