import { authApi } from "../api/auth.api";
import { authStorage } from "./auth.storage";
import { authSession } from "./auth.session";
import type {
  LoginRequest,
  RegisterInitRequest,
  CompleteRegisterRequest,
  User,
} from "../types/auth.types";

// ── Login ──────────────────────────────────────────────
export async function loginService(data: LoginRequest): Promise<User> {
  const res = await authApi.login(data);
  authStorage.setAccessToken(res.accessToken);
  await authSession.markLoggedIn();
  return res.user;
}

// ── Register 3 bước ───────────────────────────────────

// Bước 1 — gửi email → nhận verifyId
export async function registerInitService(data: RegisterInitRequest) {
  return authApi.registerInit(data);
}

// Bước 2 — verify OTP → nhận sessionToken
export async function verifyOtpService(data: {
  verifyId: string;
  otp: string;
}) {
  return authApi.verifyOtp({
    ...data,
    type: "REGISTER",
  });
}

// Bước 3 — set password → auto login
export async function completeRegisterService(
  data: CompleteRegisterRequest,
): Promise<User> {
  const res = await authApi.completeRegister(data);
  authStorage.setAccessToken(res.accessToken);
  await authSession.markLoggedIn();
  return res.user;
}

// ── Exchange (mở app lại) ─────────────────────────────
export async function exchangeService(): Promise<User> {
  const res = await authApi.exchange();
  authStorage.setAccessToken(res.accessToken);
  await authSession.markLoggedIn();
  return res.user;
}

// ── Refresh (token hết hạn) ───────────────────────────
export async function refreshService(): Promise<void> {
  const res = await authApi.refresh();
  authStorage.setAccessToken(res.accessToken);
}

// ── Logout ────────────────────────────────────────────
export async function logoutService(): Promise<void> {
  try {
    await authApi.logout();
  } finally {
    authStorage.clear();
    await authSession.markLoggedOut();
  }
}
