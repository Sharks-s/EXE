// lib/axios-py.ts
import axios from "axios";

const PY_BOT_BASE = import.meta.env.VITE_PY_BOT_BASE ?? "http://127.0.0.1:8000"

// Instance cô lập dành riêng cho Python Bot local
export const pyApi = axios.create({
  baseURL: PY_BOT_BASE,
  timeout: 3000, // Timeout ngắn (3s) vì Bot chạy ngay tại máy local
  headers: {
    "Content-Type": "application/json",
  },
});

// Không thêm bất kỳ interceptor nào vào đây để đảm bảo request sạch hoàn toàn
export default pyApi;
