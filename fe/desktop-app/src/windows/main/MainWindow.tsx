import { useEffect, useState, useRef } from "react";
import { Auth, authSession, authStorage, useAuthStore } from "@/features/auth";
import { Dashboard, focusApi, useFocusStore } from "@/features/focus-session";
import { AnalyticsPage } from "@/features/analytics";
import { SettingsPage } from "@/features/settings";
import { ProfilePage } from "@/features/profile";
import { UpgradePage } from "@/features/upgrade";
import { PetsPage as Pet } from "@/features/pet";
import {
  seedSystemSongsService,
  SongLibraryView,
  SongPlayerProvider,
} from "@/features/song";
import { FeedbackPage } from "@/features/feedback";
import Sidebar, { type Page } from "@/shared/components/Sidebar";
import { toast } from "@/shared/store/toastStore";
import { tauriStore } from "@/lib/tauriStore";


export default function MainWindow() {
  const { bootstrap, isInitializing, isAuthenticated } = useAuthStore();
  const { session } = useFocusStore();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [isCheckingActiveSession, setIsCheckingActiveSession] = useState(true);
  const hasSeedRunRef = useRef(false);

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

        const isNewUser = params.get("isNewUser") === "true";
        if (isNewUser && !hasSeedRunRef.current) {
          hasSeedRunRef.current = true;
          seedSystemSongsService().catch((err) => {
            console.error("[MainWindow] Lỗi seed nhạc hệ thống (OAuth):", err);
          });
        }
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
    const handleSessionExpired = async () => {
      authStorage.clear();
      await authSession.markLoggedOut();
      await tauriStore.delete("active_session");
      useFocusStore.getState().clearSession();
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
    <SongPlayerProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          isLocked={isSessionActive}
        />

        <main className="app-main flex-1 overflow-auto bg-[#fcf8ff]">
          {currentPage === "dashboard" && <Dashboard onNavigate={handleNavigate} />}
          {currentPage === "analytics" && <AnalyticsPage />}
          {currentPage === "settings" && <SettingsPage />}
          {currentPage === "profile" && <ProfilePage />}
          {currentPage === "upgrade" && <UpgradePage />}
          {currentPage === "pet" && <Pet />}
          {currentPage === "songs" && <SongLibraryView />}
          {currentPage === "feedback" && <FeedbackPage />}
        </main>

      </div>
    </SongPlayerProvider>
  );
}
