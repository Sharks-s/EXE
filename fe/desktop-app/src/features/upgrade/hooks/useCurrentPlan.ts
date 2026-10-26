import { useEffect, useState } from "react";
import { profileApi } from "@/features/profile";

export function useCurrentPlan(enabled = true) {
    const [isProActive, setIsProActive] = useState(false);

    useEffect(() => {
        if (!enabled) {
            setIsProActive(false);
            return;
        }

        let cancelled = false;

        profileApi
            .getDailyUsage()
            .then((usage) => {
                if (!cancelled) setIsProActive(usage.unlimited);
            })
            .catch((err) => {
                console.error("[useCurrentPlan] Failed to load current subscription:", err);
            });

        return () => {
            cancelled = true;
        };
    }, [enabled]);

    return { isProActive, setIsProActive };
}
