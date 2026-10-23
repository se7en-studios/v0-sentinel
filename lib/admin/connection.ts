/** What the panel knows about its link to /api/admin/*. A tiny external store so any hook can report and the banner can read. */

export interface ConnectionState {
  /** consecutive failed calls since the last good one */
  failures: number;
  /** ms epoch of the last good response, 0 if none yet */
  lastOkAt: number;
  /** a call came back 401/403: the session is gone */
  authExpired: boolean;
}

export const INITIAL_CONNECTION: ConnectionState = { failures: 0, lastOkAt: 0, authExpired: false };
/** one failed call can be a blip; this many in a row is an outage worth a banner */
export const FAILURES_FOR_BANNER = 2;

export type ConnectionEvent =
  | { type: "ok"; at: number }
  | { type: "fail" }
  | { type: "auth" };

export function nextConnection(s: ConnectionState, e: ConnectionEvent): ConnectionState {
  if (e.type === "ok") return { failures: 0, lastOkAt: e.at, authExpired: false };
  if (e.type === "auth") return { ...s, authExpired: true };
  return { ...s, failures: s.failures + 1 };
}

export type Health = "ok" | "offline" | "degraded" | "auth";

export function healthOf(s: ConnectionState, online: boolean): Health {
  if (s.authExpired) return "auth";
  if (!online) return "offline";
  return s.failures >= FAILURES_FOR_BANNER ? "degraded" : "ok";
}

let state = INITIAL_CONNECTION;
const listeners = new Set<() => void>();

function emit(e: ConnectionEvent) {
  state = nextConnection(state, e);
  listeners.forEach((l) => l());
}

export const reportOk = () => emit({ type: "ok", at: Date.now() });
export const reportFail = () => emit({ type: "fail" });
export const reportAuthExpired = () => emit({ type: "auth" });
export const getConnection = () => state;
export const subscribeConnection = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};
/** test helper */
export function resetConnection() {
  state = INITIAL_CONNECTION;
  listeners.forEach((l) => l());
}
