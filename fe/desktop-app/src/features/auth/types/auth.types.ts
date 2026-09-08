export interface User {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  addressLine?: string;
  provinceCode?: number;
  provinceName?: string;
  wardCode?: number;
  wardName?: string;
  createdAt: string;
  passwordUpdatedAt?: string;
  profileCompleted: boolean;
  aiSelfAddress?: string;
  aiUserAddress?: string;
  onboardingCompleted: boolean;
  personalityId?: number;
  personalityCode?: string;
  roles: string[];
  preferredLanguage?: string;
}

// ── Requests ──────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterInitRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyOtpRequest {
  verifyId: string;
  otp: string;
  type: "REGISTER" | "RESET_PASSWORD";
}

export interface CompleteRegisterRequest {
  sessionToken: string;
  password: string;
}

export interface ResetPasswordRequest {
  sessionToken: string;
  password: string;
}

// ── Responses ─────────────────────────────────────────
export interface RegisterResponse {
  email: string;
  status: string;
  expiresInSeconds: number;
  verifyId: string;
}

// Backend dùng lại RegisterResponse cho Forgot Password
export type ForgotPasswordResponse = RegisterResponse;

export interface VerifyRegisterResponse {
  sessionToken: string;
  expiresInSeconds: number;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface ExchangeResponse {
  accessToken: string;
  user: User;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}