// features/focus-session/hooks/useAppViolationWatch.ts
import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { AppRulesResponse } from "../types/focus.types";

const APP_VIOLATION_THRESHOLD_SECONDS = 7;
const APP_GRACE_PERIOD_SECONDS = 3;

interface ActiveWindowInfo {
    app_name: string;
    title: string;
}

interface UseAppViolationWatchParams {
    sessionId: number | null;
    appRules: AppRulesResponse | null;
    allowedCache: Set<string>;
    onViolation: (appName: string, windowTitle: string) => Promise<void> | void;
}

function containsKeyword(target: string, keywords: string[]): boolean {
    return keywords.some((kw) => target.includes(kw.toLowerCase().trim()));
}

export function useAppViolationWatch({
    sessionId,
    appRules,
    allowedCache,
    onViolation,
}: UseAppViolationWatchParams) {
    const currentDistractingAppRef = useRef<string | null>(null);
    const appDistractCounterRef = useRef<number>(0);
    const isHandlingViolationRef = useRef<boolean>(false);
    const leftViolationAppAtRef = useRef<number | null>(null);

    // Reset toàn bộ ref khi session đổi (mount lại)
    useEffect(() => {
        currentDistractingAppRef.current = null;
        appDistractCounterRef.current = 0;
        isHandlingViolationRef.current = false;
        leftViolationAppAtRef.current = null;
    }, [sessionId]);

    /**
     * Gọi mỗi giây từ interval chính bên ngoài (hook cha).
     */
    const tick = async (isPaused: boolean) => {
        if (!sessionId || isPaused || isHandlingViolationRef.current) return;

        try {
            const activeWindow = await invoke<ActiveWindowInfo>(
                "get_active_window_info",
            ).catch(() => null);

            if (!activeWindow) return;

            const appNameLower = activeWindow.app_name.toLowerCase().trim();
            const titleLower = activeWindow.title.toLowerCase().trim();

            const isWhitelisted =
                (appRules?.whitelist &&
                    (containsKeyword(appNameLower, appRules.whitelist) ||
                        containsKeyword(titleLower, appRules.whitelist))) ||
                allowedCache.has(appNameLower) ||
                allowedCache.has(titleLower);

            let isViolationApp = false;
            if (!isWhitelisted) {
                const isBlacklisted =
                    appRules?.blacklist &&
                    (containsKeyword(appNameLower, appRules.blacklist) ||
                        containsKeyword(titleLower, appRules.blacklist));
                if (isBlacklisted) isViolationApp = true;
            }

            if (isViolationApp) {
                const currentTarget = `${appNameLower} | ${titleLower}`;
                leftViolationAppAtRef.current = null; // đang ở app xấu -> không tính là "đã rời"

                if (currentDistractingAppRef.current === currentTarget) {
                    appDistractCounterRef.current += 1;
                } else {
                    // Đổi sang 1 app xấu KHÁC (không phải quay lại app cũ) -> reset đếm từ đầu
                    currentDistractingAppRef.current = currentTarget;
                    appDistractCounterRef.current = 1;
                }

                if (appDistractCounterRef.current >= APP_VIOLATION_THRESHOLD_SECONDS) {
                    isHandlingViolationRef.current = true;
                    appDistractCounterRef.current = 0;
                    currentDistractingAppRef.current = null;

                    Promise.resolve(onViolation(activeWindow.app_name, activeWindow.title))
                        .catch((err) => {
                            console.error("[useAppViolationWatch] Lỗi xử lý vi phạm App:", err);
                        })
                        .finally(() => {
                            isHandlingViolationRef.current = false;
                        });
                }
            } else {
                // Đang ở app hợp lệ (không vi phạm)
                if (appDistractCounterRef.current > 0 && currentDistractingAppRef.current) {
                    if (leftViolationAppAtRef.current === null) {
                        // Vừa mới rời app xấu -> bắt đầu tính grace period
                        leftViolationAppAtRef.current = 0;
                    } else {
                        leftViolationAppAtRef.current += 1;

                        if (leftViolationAppAtRef.current >= APP_GRACE_PERIOD_SECONDS) {
                            // Rời đủ lâu -> mới thực sự reset counter
                            appDistractCounterRef.current = 0;
                            currentDistractingAppRef.current = null;
                            leftViolationAppAtRef.current = null;
                        }
                    }
                }
            }
        } catch (err) {
            console.error("[useAppViolationWatch] Lỗi quét App Windows:", err);
        }
    };

    return { tick };
}