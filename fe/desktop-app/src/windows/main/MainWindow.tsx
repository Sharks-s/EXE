import { useEffect, useState } from "react";
import { useAuthStore } from "../../features/auth/stores/authStore";
import { authSession } from "../../features/auth/services/auth.session";
import { toast } from "../../shared/store/toastStore";
import Sidebar, { type Page } from "../../shared/components/Sidebar";
import Auth from "../../features/auth/pages/Auth";
import { useTranslation } from "react-i18next";

// Pages
import Dashboard from "../../features/focus-session/pages/Dashboard";
import AnalyticsPage from "../../features/analytics/pages/AnalyticsPage";
import SettingsPage from "../../features/settings/pages/SettingsPage";
import ProfilePage from "../../features/profile/pages/ProfilePage";
import UpgradePage from "../../features/upgrade/pages/UpgradePage";
import Pet from "../../features/pet/pet";

export default function MainWindow() {
  const { t } = useTranslation("common");
  const { bootstrap, isInitializing, isAuthenticated } = useAuthStore();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  // Xử lý kết quả redirect từ OAuth (nếu có) RỒI MỚI bootstrap.
  // Backend không gọi được tauriStore.set() ở phía JS, nên frontend phải tự
  // markLoggedIn() khi thấy oauth_success=true trước khi exchange token.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthSuccess = params.get("oauth_success");
    const oauthError = params.get("oauth_error");

    async function run() {
      if (oauthSuccess === "true") {
        await authSession.markLoggedIn();
      }

      if (oauthError) {
        toast.error(`Đăng nhập Google thất bại: ${oauthError}`);
      }

      if (oauthSuccess || oauthError) {
        window.history.replaceState({}, "", window.location.pathname);
      }

      bootstrap();
    }

    run();
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
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 overflow-auto bg-slate-50">
        {currentPage === "dashboard" && <Dashboard />}
        {currentPage === "analytics" && <AnalyticsPage />}
        {currentPage === "settings" && <SettingsPage />}
        {currentPage === "profile" && <ProfilePage />}
        {currentPage === "upgrade" && <UpgradePage />}
        {currentPage === "pet" && <Pet />}
      </main>
    </div>
  );
}
