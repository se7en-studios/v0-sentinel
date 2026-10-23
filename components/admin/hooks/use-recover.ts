import { useEffect, useRef } from "react";
import { getConnection } from "@/lib/admin/connection";

const RECOVER_MS = 60_000;

/**
 * While `failed`, call `load` every minute (only with the tab visible, online and with a live
 * session), and right away when the network comes back or the tab is shown again.
 */
export function useRecover(load: () => void, failed: boolean) {
  const ref = useRef(load);
  useEffect(() => {
    ref.current = load;
  });
  useEffect(() => {
    const canTry = () => !document.hidden && navigator.onLine && !getConnection().authExpired;
    const onBack = () => canTry() && ref.current();
    window.addEventListener("online", onBack);
    if (!failed) return () => window.removeEventListener("online", onBack);
    const t = setInterval(onBack, RECOVER_MS);
    document.addEventListener("visibilitychange", onBack);
    return () => {
      window.removeEventListener("online", onBack);
      document.removeEventListener("visibilitychange", onBack);
      clearInterval(t);
    };
  }, [failed]);
}
