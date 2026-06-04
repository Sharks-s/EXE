import { useEffect } from "react";
import { useAuthStore } from "../../features/auth/stores/authStore";
import Auth from "../../features/auth/pages/Auth";
import Dashboard from "../../features/focus-session/pages/Dashboard";

export default function MainWindow() {
  const { bootstrap, isInitializing, isAuthenticated } = useAuthStore();

  // Chạy 1 lần khi main window mở — check session
  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // Lắng nghe event session expired từ axios interceptor
  useEffect(() => {
    const handleSessionExpired = () => {
      useAuthStore.setState({ user: null });
    };
    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () =>
      window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, []);

  // Đang check session → không render gì để tránh flash
  if (isInitializing) return null;

  // Chưa đăng nhập → Auth page
  if (!isAuthenticated()) return <Auth />;

  // Đã đăng nhập → Dashboard
  return <Dashboard />;
}
