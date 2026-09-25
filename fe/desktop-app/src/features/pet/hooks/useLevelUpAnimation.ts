import { useEffect, useRef, useState } from "react";

type LevelSnapshot = {
  level: number | null;
  identity: string | number | null;
};

export function useLevelUpAnimation(
  level: number | null | undefined,
  durationMs = 1200,
  identity: string | number | null | undefined = null,
) {
  const previousRef = useRef<LevelSnapshot>({
    level: typeof level === "number" ? level : null,
    identity: identity ?? null,
  });
  const [isLevelingUp, setIsLevelingUp] = useState(false);

  useEffect(() => {
    const currentLevel = typeof level === "number" ? level : null;
    const currentIdentity = identity ?? null;
    const previous = previousRef.current;

    if (currentLevel === null || previous.identity !== currentIdentity) {
      previousRef.current = {
        level: currentLevel,
        identity: currentIdentity,
      };
      setIsLevelingUp(false);
      return undefined;
    }

    if (previous.level !== null && currentLevel > previous.level) {
      setIsLevelingUp(true);
      const timeoutId = window.setTimeout(() => {
        setIsLevelingUp(false);
      }, durationMs);

      previousRef.current = {
        level: currentLevel,
        identity: currentIdentity,
      };
      return () => window.clearTimeout(timeoutId);
    }

    previousRef.current = {
      level: currentLevel,
      identity: currentIdentity,
    };
    return undefined;
  }, [durationMs, identity, level]);

  return isLevelingUp;
}
