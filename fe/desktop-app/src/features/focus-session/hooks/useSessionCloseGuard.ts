// features/focus-session/hooks/useSessionCloseGuard.ts
import { useEffect, useRef } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { focusApi } from "../api/focus.api";
import { useFocusStore } from "../stores/focusStore";

interface UseSessionCloseGuardParams {
    sessionId: number | null;
    elapsed: number;
    isBreaking: boolean;
    breakRemaining: number;
}

export function useSessionCloseGuard({
    sessionId,
    elapsed,
    isBreaking,
    breakRemaining,
}: UseSessionCloseGuardParams) {
    const stateRef = useRef({ sessionId, elapsed, isBreaking, breakRemaining });
    useEffect(() => {
        stateRef.current = { sessionId, elapsed, isBreaking, breakRemaining };
    });

    useEffect(() => {
        const currentWindow = getCurrentWebviewWindow();

        const unlistenPromise = currentWindow.onCloseRequested(async (event) => {
            const { sessionId, elapsed, isBreaking, breakRemaining } = stateRef.current;
            if (!sessionId) return;

            event.preventDefault();

            try {
                const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
                const main = await WebviewWindow.getByLabel("main");
                const widget = await WebviewWindow.getByLabel("widget");
                await main?.show();
                await widget?.hide();

                useFocusStore.getState().setIsClosing(true);

                await Promise.race([
                    focusApi.saveCloseSnapshot(sessionId, {
                        elapsedSeconds: elapsed,
                        wasBreaking: isBreaking,
                        breakRemainingSeconds: isBreaking ? breakRemaining : null,
                    }),
                    new Promise((resolve) => setTimeout(resolve, 2000)),
                ]);
            } catch (err) {
                console.error("[useSessionCloseGuard] Lỗi lưu close-snapshot:", err);
            } finally {
                await currentWindow.destroy();
            }
        });

        return () => {
            unlistenPromise.then((f) => f());
        };
    }, []);
}