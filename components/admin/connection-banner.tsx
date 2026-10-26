"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { CloudOff, KeyRound } from "lucide-react";
import {
  getConnection,
  healthOf,
  INITIAL_CONNECTION,
  subscribeConnection,
} from "@/lib/admin/connection";
import type { Translate } from "@/lib/admin/i18n";
import { ageText } from "@/lib/admin/age";

const subscribeOnline = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

const btn =
  "shrink-0 rounded-md px-2 py-0.5 font-semibold underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * One calm strip for "the panel cannot reach its data": offline, server failing, or session expired.
 * The topbar sync badge keeps showing the save state of the workspace; this explains what it means for the data.
 */
export function ConnectionBanner({
  t,
  sync,
  retrySync,
  reload,
  logout,
}: {
  t: Translate;
  sync: string;
  retrySync: () => void;
  reload: () => void;
  logout: () => void;
}) {
  const conn = useSyncExternalStore(
    subscribeConnection,
    getConnection,
    () => INITIAL_CONNECTION,
  );
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
  const [now, setNow] = useState(() => Date.now());
  const health = healthOf(conn, online);

  useEffect(() => {
    if (health === "ok") return;
    const id = setInterval(() => setNow(Date.now()), 30_000);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refresh the age as soon as the banner shows
    setNow(Date.now());
    return () => clearInterval(id);
  }, [health]);

  // back online: upload what was saved on this device without waiting for the next edit
  useEffect(() => {
    if (online && sync === "error") retrySync();
    // only the offline -> online transition matters, not every sync change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  if (health === "ok") return null;
  const Icon = health === "auth" ? KeyRound : CloudOff;
  const text = t(
    health === "auth"
      ? "conn.auth"
      : health === "offline"
        ? "conn.offline"
        : "conn.degraded",
  );
  return (
    <div
      role="status"
      data-testid="connection-banner"
      data-health={health}
      className="flex shrink-0 items-start gap-2 border-b border-[var(--hairline)] bg-[var(--state-warn)]/10 px-3 py-1.5 text-[12px] text-foreground/80"
    >
      <Icon
        className="mt-0.5 size-3.5 shrink-0 text-foreground/55"
        aria-hidden
      />
      <p className="min-w-0 flex-1">
        {text}{" "}
        {health !== "auth" && (
          <span className="text-foreground/60">
            {conn.lastOkAt
              ? t("conn.lastGood", { age: ageText(t, conn.lastOkAt, now) })
              : t("conn.noData")}
          </span>
        )}
      </p>
      {health === "auth" ? (
        <button
          type="button"
          onClick={logout}
          className={`${btn} text-primary`}
        >
          {t("conn.login")}
        </button>
      ) : (
        online && (
          <button
            type="button"
            onClick={reload}
            className={`${btn} text-primary`}
          >
            {t("conn.retry")}
          </button>
        )
      )}
    </div>
  );
}
