import { useEffect, useState } from "react";
import { useAuthStore } from "../../features/auth/stores/authStore";
import { authSession } from "../../features/auth/services/auth.session";
import { toast } from "../../shared/store/toastStore";
import Sidebar, { type Page } from "../../shared/components/Sidebar";
import Auth from "../../features/auth/pages/Auth";
import CompleteProfileModal from "../../shared/components/CompleteProfileModal";
import { profileApi } from "../../features/profile/api/profile.api";

import Dashboard from "../../features/focus-session/pages/Dashboard";
import AnalyticsPage from "../../features/analytics/pages/AnalyticsPage";
import SettingsPage from "../../features/settings/pages/SettingsPage";
import ProfilePage from "../../features/profile/pages/ProfilePage";
import UpgradePage from "../../features/upgrade/pages/UpgradePage";
import Pet from "../../features/pet/pages/PetsPage";

export default function MainWindow() {
  const { bootstrap, isInitializing, isAuthenticated } = useAuthStore();
  // Lấy user object trực tiếp để dùng làm dependency (isAuthenticated là function, không reactive)
  const user = useAuthStore((s) => s.user);
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
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

  // Kiểm tra profile completion MỖI LẦN user đăng nhập (user.id thay đổi).
  // Chỉ dựa vào profileCompleted/profile_completed/completed:
  // false thì hiện popup, true thì không hiện.
  useEffect(() => {
    if (!user) return; // chưa đăng nhập → bỏ qua

    let cancelled = false;

    const checkProfile = async () => {
      try {
        const result = await profileApi.getProfileCompletion();
        const profileCompleted =
          result.profileCompleted ?? result.profile_completed ?? result.completed;

        if (!cancelled) {
          setShowProfileModal(profileCompleted === false);
        }
      } catch {
        // Bỏ qua lỗi network, không chặn user vào app.
      }
    };

    checkProfile();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

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

      {/* Popup nhập thông tin cá nhân nếu chưa hoàn thiện */}
      <CompleteProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onCompleted={() => setShowProfileModal(false)}
      />
    </div>
  );
}
