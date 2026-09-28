import { create } from "zustand";
import type { User } from "../types/auth.types";
import {
  loginService,
  logoutService,
  exchangeService,
  registerInitService,
  verifyOtpService,
  completeRegisterService,
  oauthExchangeService,
} from "../services/auth.service";
import { authSession } from "../services/auth.session";
import type {
  LoginRequest,
  RegisterInitRequest,
  CompleteRegisterRequest,
  RegisterResponse,
  VerifyRegisterResponse,
} from "../types/auth.types";
import i18n from "@/i18n";

interface AuthState {
  user: User | null;
  isInitializing: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  bootstrap: () => Promise<void>;
  login: (data: LoginRequest) => Promise<void>;

  // Register 3 bước
  registerInit: (data: RegisterInitRequest) => Promise<RegisterResponse>;
  verifyOtp: (data: {
    verifyId: string;
    otp: string;
  }) => Promise<VerifyRegisterResponse>;
  completeRegister: (data: CompleteRegisterRequest) => Promise<void>;

  logout: () => Promise<void>;
  clearError: () => void;

  // Computed
  isAuthenticated: () => boolean;

  loginWithOAuth: (code: string) => Promise<void>;
}

// ── Sync ngôn ngữ bất đồng bộ & an toàn 
async function syncLanguageFromUser(user: User | null) {
  const preferredLanguage = user?.preferredLanguage;
  if (preferredLanguage && preferredLanguage !== i18n.language) {
    await i18n.changeLanguage(preferredLanguage);
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isInitializing: true,
  isLoading: false,
  error: null,

  isAuthenticated: () => !!get().user,

  bootstrap: async () => {
    const canRefresh = await authSession.canRefresh();
    if (!canRefresh) {
      set({ isInitializing: false });
      return;
    }
    try {
      const user = await exchangeService();
      await syncLanguageFromUser(user);
      set({ user, isInitializing: false });
    } catch {
      set({ user: null, isInitializing: false });
    }
  },

  login: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const user = await loginService(data);
      await syncLanguageFromUser(user);
      set({ user });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : "LOGIN_FAILED" });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // Bước 1 — gửi email, nhận verifyId
  registerInit: async (data) => {
    set({ isLoading: true, error: null });
    try {
      return await registerInitService(data);
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : "REGISTER_FAILED" });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // Bước 2 — verify OTP, nhận sessionToken
  verifyOtp: async (data) => {
    set({ isLoading: true, error: null });
    try {
      return await verifyOtpService(data);
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : "OTP_INVALID" });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // Bước 3 — set password, auto login
  completeRegister: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const user = await completeRegisterService(data);
      await syncLanguageFromUser(user);
      set({ user });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : "COMPLETE_FAILED" });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await logoutService();
    } finally {
      set({ user: null, error: null, isLoading: false });
    }
  },

  loginWithOAuth: async (code) => {
    set({ isLoading: true, error: null });
    try {
      const user = await oauthExchangeService(code);
      await syncLanguageFromUser(user);
      set({ user });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : "OAUTH_EXCHANGE_FAILED" });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));