// features/focus-session/hooks/useAppViolationWatch.ts
import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { AppRulesResponse } from "../types/focus.types";

const VIOLATION_THRESHOLD_SECONDS = 7;
const GRACE_PERIOD_SECONDS = 3;

interface ActiveWindowInfo {
    app_name: string;
    title: string;
}

interface UseAppViolationWatchParams {
    sessionId: number | null;
    appRules: AppRulesResponse | null;
    allowedCache: Set<string>;
    violatingCache: Set<string>;
    onViolation: (appName: string, windowTitle: string) => Promise<void> | void;
    onClassifyApp: (appName: string, windowTitle: string) => Promise<void> | void;
}

function containsKeyword(target: string, keywords: string[]): boolean {
    return keywords.some((kw) => target.includes(kw.toLowerCase().trim()));
}

// ── Bộ đếm dùng chung: đếm liên tục + chờ (grace period) trước khi reset ──
interface StickyCounter {
    target: string | null;
    counter: number;
    leftAt: number | null; // null = đang ở đúng target; số = đã rời được bao nhiêu giây
}

function createStickyCounter(): StickyCounter {
    return { target: null, counter: 0, leftAt: null };
}

function resetStickyCounter(state: StickyCounter) {
    state.target = null;
    state.counter = 0;
    state.leftAt = null;
}

/**
 * Gọi mỗi giây. Trả về true nếu vừa đạt đủ ngưỡng (threshold).
 * isMatch: app hiện tại có khớp với điều kiện đang theo dõi không (blacklist / app lạ...)
 */
function tickStickyCounter(
    state: StickyCounter,
    target: string,
    isMatch: boolean,
    threshold: number,
    gracePeriod: number,
): boolean {
    if (!isMatch) {
        if (state.counter > 0) {
            if (state.leftAt === null) {
                state.leftAt = 0;
            } else {
                state.leftAt += 1;
                if (state.leftAt >= gracePeriod) {
                    resetStickyCounter(state);
                }
            }
        }
        return false;
    }

    // Đang match -> hủy trạng thái "đã rời", tiếp tục đếm
    state.leftAt = null;

    if (state.target === target) {
        state.counter += 1;
    } else {
        state.target = target;
        state.counter = 1;
    }

    if (state.counter >= threshold) {
        resetStickyCounter(state);
        return true;
    }
    return false;
}

export function useAppViolationWatch({
    sessionId,
    appRules,
    allowedCache,
    violatingCache,
    onViolation,
    onClassifyApp,
}: UseAppViolationWatchParams) {
    const blacklistCounterRef = useRef<StickyCounter>(createStickyCounter());
    const unknownAppCounterRef = useRef<StickyCounter>(createStickyCounter());

    const isHandlingViolationRef = useRef<boolean>(false);
    const isClassifyingRef = useRef<boolean>(false);

    useEffect(() => {
        resetStickyCounter(blacklistCounterRef.current);
        resetStickyCounter(unknownAppCounterRef.current);
        isHandlingViolationRef.current = false;
        isClassifyingRef.current = false;
    }, [sessionId]);

    const tick = async (isPaused: boolean) => {
        if (!sessionId || isPaused) return;

        try {
            const activeWindow = await invoke<ActiveWindowInfo>(
                "get_active_window_info",
            ).catch(() => null);

            if (!activeWindow) return;

            const appNameLower = activeWindow.app_name.toLowerCase().trim();
            const titleLower = activeWindow.title.toLowerCase().trim();
            const currentTarget = `${appNameLower} | ${titleLower}`;

            const isWhitelisted =
                (appRules?.whitelist &&
                    (containsKeyword(appNameLower, appRules.whitelist) ||
                        containsKeyword(titleLower, appRules.whitelist))) ||
                allowedCache.has(appNameLower) ||
                allowedCache.has(titleLower);

            const isBlacklisted =
                !isWhitelisted &&
                !!appRules?.blacklist &&
                (containsKeyword(appNameLower, appRules.blacklist) ||
                    containsKeyword(titleLower, appRules.blacklist));

            const isKnownViolating =
                violatingCache.has(appNameLower) || violatingCache.has(titleLower);

            // ── NHÁNH 1: Blacklist rõ ràng hoặc đã từng bị AI phán vi phạm ──
            const isBlacklistMatch =
                !isHandlingViolationRef.current && (isBlacklisted || isKnownViolating);

            const blacklistTriggered = tickStickyCounter(
                blacklistCounterRef.current,
                currentTarget,
                isBlacklistMatch,
                VIOLATION_THRESHOLD_SECONDS,
                GRACE_PERIOD_SECONDS,
            );

            if (blacklistTriggered) {
                isHandlingViolationRef.current = true;
                Promise.resolve(onViolation(activeWindow.app_name, activeWindow.title))
                    .catch((err) => {
                        console.error("[useAppViolationWatch] Lỗi xử lý vi phạm App:", err);
                    })
                    .finally(() => {
                        isHandlingViolationRef.current = false;
                    });
                return;
            }

            if (isBlacklistMatch) return; // đang trong quá trình đếm blacklist, không cần xét app lạ

            // ── NHÁNH 2: App lạ (không whitelist, không blacklist, chưa từng phân loại) ──
            const isUnknownApp =
                !isWhitelisted && !isBlacklisted && !isKnownViolating;

            const isUnknownMatch =
                !isHandlingViolationRef.current && !isClassifyingRef.current && isUnknownApp;

            const unknownTriggered = tickStickyCounter(
                unknownAppCounterRef.current,
                currentTarget,
                isUnknownMatch,
                VIOLATION_THRESHOLD_SECONDS,
                GRACE_PERIOD_SECONDS,
            );

            if (unknownTriggered) {
                isClassifyingRef.current = true;
                Promise.resolve(onClassifyApp(activeWindow.app_name, activeWindow.title))
                    .catch((err) => {
                        console.error("[useAppViolationWatch] Lỗi phân loại app lạ:", err);
                    })
                    .finally(() => {
                        isClassifyingRef.current = false;
                    });
            }
        } catch (err) {
            console.error("[useAppViolationWatch] Lỗi quét App Windows:", err);
        }
    };

    return { tick };
}