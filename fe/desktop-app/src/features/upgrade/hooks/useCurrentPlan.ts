import { useEffect, useState } from "react";
import { profileApi } from "@/features/profile";

export function useCurrentPlan() {
    const [isProActive, setIsProActive] = useState(false);

    useEffect(() => {
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
    }, []);

    return { isProActive, setIsProActive };
}