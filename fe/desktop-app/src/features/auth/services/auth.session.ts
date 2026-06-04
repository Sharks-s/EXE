import { tauriStore } from "../../../lib/tauriStore";

const SESSION_KEY = "auth:logged_in";

// Tauri Store thay localStorage vì:
// 1. Persist sau khi tắt app (giống localStorage)
// 2. Lưu trong file mã hóa trên máy user, an toàn hơn
// 3. Không bị clear khi user xóa browser data

export const authSession = {
  async markLoggedIn(): Promise<void> {
    await tauriStore.set(SESSION_KEY, "1");
  },

  async markLoggedOut(): Promise<void> {
    await tauriStore.delete(SESSION_KEY);
  },

  async canRefresh(): Promise<boolean> {
    const val = await tauriStore.get<string>(SESSION_KEY);
    return val === "1";
  },
};
