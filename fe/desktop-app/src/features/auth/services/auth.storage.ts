// Access token lưu trong memory (biến JS)
// Lý do: Không bị XSS đọc được như localStorage
// Mất khi app tắt → dùng /auth/exchange để lấy lại từ cookie

let accessToken: string | null = null;

export const authStorage = {
  setAccessToken(token: string | null) {
    accessToken = token;
  },
  getAccessToken(): string | null {
    return accessToken;
  },
  clear() {
    accessToken = null;
  },
};
