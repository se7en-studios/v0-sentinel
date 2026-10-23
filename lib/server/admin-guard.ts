import { isAuthed } from "@/lib/admin/auth";
import { firebaseEnabled } from "@/lib/admin/firebase";
import { verifyFirebaseToken } from "@/lib/admin/firebase-verify";
import { clientIp, limitResponse, type Limiter } from "./rate-limit";

/**
 * Cookie sessions only: a state-changing request whose Origin is another site is refused (CSRF).
 * SameSite=Lax already blocks the cookie cross-site; this is the second layer. Bearer tokens are not ambient, so exempt.
 */
export function crossSite(req: Request) {
  if (req.method === "GET" || req.method === "HEAD") return false;
  const origin = req.headers.get("origin");
  if (!origin) return false; // non-browser clients and same-origin fetches without Origin
  try {
    return new URL(origin).host !== new URL(req.url).host;
  } catch {
    return true;
  }
}

/** Admin API access: a verified Firebase token when Firebase is on, otherwise the session cookie. */
export async function allowed(req: Request) {
  if (firebaseEnabled) {
    const token =
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    return token ? verifyFirebaseToken(token) : false;
  }
  return !crossSite(req) && (await isAuthed());
}

/** Per-IP throttle first (cheap, also slows token guessing), then auth. Null means "go ahead". */
export async function guardAdmin(
  req: Request,
  limiter: Limiter,
): Promise<Response | null> {
  const limited = limitResponse(limiter, clientIp(req));
  if (limited) return limited;
  if (await allowed(req)) return null;
  return Response.json({ error: "No autorizado" }, { status: 401 });
}
