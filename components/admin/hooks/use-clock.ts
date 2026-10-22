import { useEffect, useState } from "react";

const STEP_MS = 600_000;

/**
 * Wall clock for the panel. `now` ticks every `tickMs` (paused while the tab is hidden);
 * `nowStep` only changes every 10 minutes, so recency windows can memoize on it.
 */
export function useClock(tickMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => {
      if (!document.hidden) setNow(Date.now());
    }, tickMs);
    return () => clearInterval(t);
  }, [tickMs]);
  return { now, nowStep: Math.floor(now / STEP_MS) };
}
