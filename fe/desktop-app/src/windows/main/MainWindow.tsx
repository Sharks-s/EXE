import { useEffect, useState } from "react";
import { useAuthStore } from "../../features/auth/stores/authStore";
import Sidebar, { type Page } from "../../shared/components/Sidebar";
import Auth from "../../features/auth/pages/Auth";
import { useTranslation } from "react-i18next";

// Pages
import Dashboard from "../../features/focus-session/pages/Dashboard";
import AnalyticsPage from "../../features/analytics/pages/AnalyticsPage";
import SettingsPage from "../../features/settings/pages/SettingsPage";
import ProfilePage from "../../features/profile/pages/ProfilePage";
import UpgradePage from "../../features/upgrade/pages/UpgradePage";

export default function MainWindow() {
  const { t } = useTranslation("common");
  const { bootstrap, isInitializing, isAuthenticated } = useAuthStore();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

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
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar luôn hiện khi đã login */}
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

      {/* Nội dung thay đổi theo page */}
      <main className="flex-1 overflow-auto bg-slate-50">
        {currentPage === "dashboard" && <Dashboard />}
        {currentPage === "analytics" && <AnalyticsPage />}
        {currentPage === "settings" && <SettingsPage />}
        {currentPage === "profile" && <ProfilePage />}
        {currentPage === "upgrade" && <UpgradePage />}
      </main>
    </div>
  );
}
