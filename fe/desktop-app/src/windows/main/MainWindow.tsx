import { useEffect, useState } from "react";
import { useAuthStore } from "../../features/auth/stores/authStore";
import { authSession } from "../../features/auth/services/auth.session";
import { useFocusStore } from "../../features/focus-session/stores/focusStore";
import { toast } from "../../shared/store/toastStore";
import Sidebar, { type Page } from "../../shared/components/Sidebar";
import Auth from "../../features/auth/pages/Auth";
import { focusApi } from "../../features/focus-session/api/focus.api";
import Dashboard from "../../features/focus-session/pages/Dashboard";
import AnalyticsPage from "../../features/analytics/pages/AnalyticsPage";
import SettingsPage from "../../features/settings/pages/SettingsPage";
import ProfilePage from "../../features/profile/pages/ProfilePage";
import UpgradePage from "../../features/upgrade/pages/UpgradePage";
import Pet from "../../features/pet/pages/PetsPage";

export default function MainWindow() {
  const { bootstrap, isInitializing, isAuthenticated } = useAuthStore();
  const { session } = useFocusStore();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [isCheckingActiveSession, setIsCheckingActiveSession] = useState(true);

  const isSessionActive = !!session;

  const handleNavigate = (page: Page) => {
    if (isSessionActive && page !== "dashboard") {
      toast.error(
        "Đang trong phiên tập trung, hãy kết thúc phiên trước khi chuyển trang",
      );
      return;
    }
    setCurrentPage(page);
  };
  // Lấy user object trực tiếp để dùng làm dependency (isAuthenticated là function, không reactive)
  const user = useAuthStore((s) => s.user);
  const [showProfileModal, setShowProfileModal] = useState(false);

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

  useEffect(() => {
    async function checkActiveSession() {
      if (isInitializing || !isAuthenticated()) {
        setIsCheckingActiveSession(false);
        return;
      }
      try {
        const activeSession = await focusApi.getActiveSession();
        if (activeSession) {
          useFocusStore.getState().setSession(activeSession);
          useFocusStore.getState().setResumeConfirmPending(true);
        }
      } catch (err) {
        console.error("[MainWindow] Lỗi khi check session đang active:", err);
      } finally {
        setIsCheckingActiveSession(false);
      }
    }
    checkActiveSession();
  }, [isInitializing, isAuthenticated]);

  // Đang check session → không render gì để tránh flash
  if (isInitializing || isCheckingActiveSession) return null;

  // Chưa đăng nhập → Auth page
  if (!isAuthenticated()) return <Auth />;

  // Đã đăng nhập → Dashboard
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isLocked={isSessionActive}
      />

      <main className="app-main flex-1 overflow-auto bg-slate-50">
        {currentPage === "dashboard" && <Dashboard onNavigate={handleNavigate} />}
        {currentPage === "analytics" && <AnalyticsPage />}
        {currentPage === "settings" && <SettingsPage />}
        {currentPage === "profile" && <ProfilePage />}
        {currentPage === "upgrade" && <UpgradePage />}
        {currentPage === "pet" && <Pet />}
      </main>

    </div>
  );
}
