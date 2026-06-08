// features/auth/services/auth.session.ts
import { tauriStore } from "../../../lib/tauriStore";

const SESSION_KEY = "auth:logged_in";

// Giữ lại độ trễ này vì nó là "chìa khóa" giúp LazyStore đồng bộ kịp với Rust Core
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const authSession = {
  async markLoggedIn(): Promise<void> {
    await tauriStore.set(SESSION_KEY, "1");
  },

  async markLoggedOut(): Promise<void> {
    await tauriStore.delete(SESSION_KEY);
  },

  async canRefresh(): Promise<boolean> {
    try {
      await delay(150);
      const val = await tauriStore.get<string>(SESSION_KEY);
      return val === "1";
    } catch {
      return false;
    }
  },
};
