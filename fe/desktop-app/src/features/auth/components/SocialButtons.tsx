import React, { useRef, useState } from "react";
import { start, cancel, onUrl } from "@fabianlars/tauri-plugin-oauth";
import { openUrl } from "@tauri-apps/plugin-opener";
// TODO: sửa đường dẫn import cho đúng với project của bạn
import { useAuthStore } from "../stores/authStore";

const API_BASE = import.meta.env.VITE_API_BASE ?? "https://focusbuddy-api-lw5a.onrender.com";
const OAUTH_TIMEOUT_MS = 2 * 60 * 1000;
const OAUTH_SUCCESS_RESPONSE = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Focus Buddy</title>
</head>
<body>
  Đăng nhập thành công! Bạn có thể đóng tab này và quay lại ứng dụng.
</body>
</html>`;

const SocialButtons: React.FC = () => {
    const loginWithOAuth = useAuthStore((s) => s.loginWithOAuth);
    const [waiting, setWaiting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Giữ hàm dọn dẹp của lần bấm trước để bấm lại được (vd: lỡ đóng tab browser)
    const cleanupRef = useRef<(() => Promise<void>) | null>(null);

    const handleGoogleLogin = async (): Promise<void> => {
        await cleanupRef.current?.();
        setError(null);
        setWaiting(true);

        let port: number | null = null;
        let unlisten: (() => void) | null = null;
        let timer: ReturnType<typeof setTimeout> | null = null;
        let finished = false;
        let handled = false;

        const cleanup = async () => {
            if (finished) return;
            finished = true;
            if (timer) clearTimeout(timer);
            unlisten?.();
            if (port !== null) {
                try {
                    await cancel(port);
                } catch {
                    /* server đã tắt rồi thì bỏ qua */
                }
            }
            setWaiting(false);
        };
        cleanupRef.current = cleanup;

        try {
            // 1. Dựng server tạm trên port ngẫu nhiên
            port = await start({
                response: OAUTH_SUCCESS_RESPONSE,
            });

            // 2. Chờ BE redirect về http://localhost:{port}/?oauth_success=...
            unlisten = await onUrl(async (url) => {
                if (handled) return;

                const params = new URL(url).searchParams;
                const code = params.get("code");
                const oauthError = params.get("oauth_error");

                if (params.get("oauth_success") === "true" && code) {
                    handled = true;
                    try {
                        await loginWithOAuth(code);
                    } catch (e) {
                        setError(e instanceof Error ? e.message : "OAUTH_EXCHANGE_FAILED");
                    } finally {
                        // Chờ chút để browser kịp nhận trang phản hồi rồi mới tắt server
                        setTimeout(() => void cleanup(), 500);
                    }
                } else if (oauthError) {
                    handled = true;
                    setError(oauthError);
                    setTimeout(() => void cleanup(), 500);
                }
                // Request khác (vd: /favicon.ico) thì bỏ qua, tiếp tục chờ
            });

            // 3. Hết giờ thì dọn server tạm
            timer = setTimeout(async () => {
                await cleanup();
                setError("OAUTH_TIMEOUT");
            }, OAUTH_TIMEOUT_MS);

            // 4. Mở browser hệ thống
            await openUrl(
                `${API_BASE}/oauth2/authorization/google?tauri_callback_port=${port}`,
            );
        } catch (e) {
            await cleanup();
            setError(e instanceof Error ? e.message : "OAUTH_START_FAILED");
        }
    };

    return (
        <div className="flex flex-col items-center gap-2 mt-2">
            <div className="flex items-center justify-center gap-4">
                {/* Nút Google */}
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-32 h-10 px-4 inline-flex items-center justify-center gap-2.5 rounded-full bg-white text-slate-700 font-medium text-sm shadow-md hover:shadow-lg hover:bg-slate-50 transition-all duration-200 border border-slate-100 cursor-pointer"
                >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Google</span>
                </button>

                {/* Nút Facebook */}
                <button
                    type="button"
                    disabled
                    className="w-32 h-10 px-4 inline-flex items-center justify-center gap-2.5 rounded-full bg-[#2d325a] text-white font-medium text-sm shadow-md opacity-60 cursor-not-allowed transition-all duration-200"
                >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span>Facebook</span>
                </button>
            </div>

            {waiting && (
                <p className="text-xs text-slate-300">
                    Đang chờ bạn hoàn tất đăng nhập trong trình duyệt...
                </p>
            )}
            {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
    );
};

export default SocialButtons;
