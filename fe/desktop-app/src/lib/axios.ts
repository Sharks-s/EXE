import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { authStorage, authSession } from "@/features/auth";


// const API_BASE = import.meta.env.VITE_API_BASE ?? "https://focusbuddy-api-lw5a.onrender.com";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // gửi HttpOnly cookie refresh token
  timeout: 10000,
});

// ── Types ──────────────────────────────────────────────
interface QueueItem {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}

// ── Refresh Token State ────────────────────────────────
// Desktop app chỉ có 1 window → không cần navigator.locks
// Dùng in-memory flag đơn giản là đủ
let isRefreshing = false;
let failedQueue: QueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((item) => {
    if (error) item.reject(error);
    else if (token) item.resolve(token);
  });
  failedQueue = [];
};

// ── Request Interceptor ────────────────────────────────
// Gắn access token vào mọi request
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor ───────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) return Promise.reject(error);

    const status = error.response?.status;
    // const url = originalRequest.url ?? "";

    // const isPublicAuthRoute =
    //   url.includes("/auth/login") ||
    //   url.includes("/auth/register") ||
    //   url.includes("/auth/forgot-password") ||
    //   url.includes("/auth/reset-password");

    const hasToken = !!authStorage.getAccessToken();
    const canRefresh = await authSession.canRefresh();

    // CASE 1: Không có access token (mở app lại sau khi tắt)
    // → Gọi /auth/exchange để lấy token mới từ cookie
    if (
      status === 401 &&
      !hasToken &&
      canRefresh &&
      !originalRequest.url?.includes("/auth/exchange") &&
      !originalRequest.url?.includes("/auth/oauth/exchange")
    ) {
      try {
        // Import động để tránh circular dependency
        const { exchangeService } =
          await import("@/features/auth/services/auth.service");
        await exchangeService();
        const newToken = authStorage.getAccessToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch {
        window.dispatchEvent(new Event("auth:session-expired"));
      }
      return Promise.reject(error);
    }

    // CASE 2: Access token hết hạn → Refresh
    if (
      status === 401 &&
      hasToken &&
      canRefresh &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      // Nếu đang refresh → vào queue chờ
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        const { refreshService } =
          await import("@/features/auth/services/auth.service");
        await refreshService();
        const newToken = authStorage.getAccessToken();

        if (!newToken) throw new Error("Refresh failed");

        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        window.dispatchEvent(new Event("auth:session-expired"));
        return new Promise(() => { }); // pending forever, tránh error toast
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
