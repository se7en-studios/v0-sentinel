import { HttpError, parseRetryAfter, withRetry, type RetryOptions } from "./retry";
import { reportAuthExpired, reportFail, reportOk } from "./connection";

/** Firebase codes that mean "sign in again" (network failures are not among them). */
const isAuthCode = (e: unknown) => {
  const code = (e as { code?: unknown } | null)?.code;
  return typeof code === "string" && code.startsWith("auth/") && code !== "auth/network-request-failed";
};

/**
 * GET JSON from /api/admin/* with the bearer token, retried with backoff and reported to the
 * connection store. A 401/403 (or an expired Firebase token) is never retried: it flags the session.
 */
export async function adminJson<T>(
  url: string,
  getToken: (() => Promise<string>) | undefined,
  opts: { retry?: RetryOptions; errorMessage?: string; quiet?: boolean } = {},
): Promise<T> {
  try {
    const out = await withRetry(async () => {
      let token: string | null = null;
      try {
        token = getToken ? await getToken() : null;
      } catch (e) {
        if (isAuthCode(e)) throw new HttpError("Sesión vencida", 401);
        throw e;
      }
      const res = await fetch(url, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok)
        throw new HttpError(
          body?.error ?? opts.errorMessage ?? `Error ${res.status}`,
          Number(res.status) || 0,
          parseRetryAfter(res.headers?.get?.("Retry-After"), Date.now()),
        );
      return body as T;
    }, { isOnline: () => typeof navigator === "undefined" || navigator.onLine, ...opts.retry });
    if (!opts.quiet) reportOk();
    return out;
  } catch (e) {
    // quiet calls (terrain lookups) are best-effort: their failures are not an outage of the panel
    if (opts.quiet && !(e instanceof HttpError && (e.status === 401 || e.status === 403))) throw e;
    if (e instanceof HttpError && (e.status === 401 || e.status === 403)) reportAuthExpired();
    else reportFail();
    throw e;
  }
}
