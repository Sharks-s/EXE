import { LazyStore } from "@tauri-apps/plugin-store";

// Singleton store — dùng chung toàn app
const store = new LazyStore("focusbuddy.dat");

export const tauriStore = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await store.get<T>(key);
      return value ?? null;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown): Promise<void> {
    try {
      await store.set(key, value);
      await store.save();
    } catch {
      // ignore
    }
  },

  async delete(key: string): Promise<void> {
    try {
      await store.delete(key);
      await store.save();
    } catch {
      // ignore
    }
  },
};
