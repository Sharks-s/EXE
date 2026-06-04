import { create } from "zustand";
import type { User } from "../types/auth.types";
import {
  loginService,
  logoutService,
  exchangeService,
  registerInitService,
  verifyOtpService,
  completeRegisterService,
} from "../services/auth.service";
import { authSession } from "../services/auth.session";
import type {
  LoginRequest,
  RegisterInitRequest,
  CompleteRegisterRequest,
  RegisterResponse,
  VerifyRegisterResponse,
} from "../types/auth.types";

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
      set({ user, isInitializing: false });
    } catch {
      set({ user: null, isInitializing: false });
    }
  },

  login: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const user = await loginService(data);
      set({ user });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đăng nhập thất bại";
      set({ error: message });
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
      const message = err instanceof Error ? err.message : "Đăng ký thất bại";
      set({ error: message });
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
      const message = err instanceof Error ? err.message : "Mã OTP không đúng";
      set({ error: message });
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
      set({ user }); // auto login → drive UI sang SetupProfile hoặc Dashboard
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Có lỗi xảy ra";
      set({ error: message });
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
      set({ user: null, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
