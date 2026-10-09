// features/focus-session/hooks/useSessionCloseGuard.ts
import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
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
                await invoke("restore_main_window");

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
