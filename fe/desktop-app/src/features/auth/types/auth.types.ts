// ── User ──────────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  roles: string[];
}

// ── Requests ──────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterInitRequest {
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

// ── Responses ─────────────────────────────────────────
export interface RegisterResponse {
  email: string;
  status: string;
  expiresInSeconds: number;
  verifyId: string;
}

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
