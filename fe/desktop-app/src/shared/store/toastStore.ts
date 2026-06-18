import { create } from "zustand";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number; // ms
}

interface ToastState {
  toasts: Toast[];
  show: (type: ToastType, message: string, duration?: number) => void;
  dismiss: (id: string) => void;
}

const DEFAULT_DURATION = 4000;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  show: (type, message, duration = DEFAULT_DURATION) => {
    const id = crypto.randomUUID();
    set({ toasts: [...get().toasts, { id, type, message, duration }] });
  },

  dismiss: (id) => {
    set({ toasts: get().toasts.filter((toast) => toast.id !== id) });
  },
}));

// Helper gọi nhanh, không cần useToastStore() trong component
// Dùng được cả ngoài component (vd: trong axios interceptor, service layer)
export const toast = {
  success: (message: string, duration?: number) =>
    useToastStore.getState().show("success", message, duration),
  error: (message: string, duration?: number) =>
    useToastStore.getState().show("error", message, duration),
  warning: (message: string, duration?: number) =>
    useToastStore.getState().show("warning", message, duration),
  info: (message: string, duration?: number) =>
    useToastStore.getState().show("info", message, duration),
};
