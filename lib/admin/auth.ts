import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "sentinel_admin";
const SESSION_DAYS = 14;

// ponytail: single shared password (ADMIN_PASSWORD). Sessions are
// "<expiry>.<hmac>" signed with ADMIN_SESSION_SECRET (falls back to the
// password); rotating either invalidates every session. Per-client accounts
// (Supabase auth) are the next step once there is a first paying client.
const password = () => process.env.ADMIN_PASSWORD ?? "";
const secret = () => process.env.ADMIN_SESSION_SECRET || password();

/**
 * Fail closed in production: with no password configured the panel stays
 * locked. Outside production it opens as a demo so local dev needs no setup.
 */
export const authConfigured = () => Boolean(password());
export const isOpenDemo = () =>
  !authConfigured() && process.env.NODE_ENV !== "production";
export const authRequired = () => authConfigured();

const sign = (exp: string) =>
  createHmac("sha256", secret()).update(`sentinel-admin:${exp}`).digest("hex");

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export function passwordMatches(input: string) {
  const expected = password();
  if (!expected) return false;
  // hash both sides so the comparison is constant-length
  const h = (v: string) =>
    createHmac("sha256", "pw-compare").update(v).digest("hex");
  return safeEqual(h(input), h(expected));
}

export function newSessionToken() {
  const exp = String(Date.now() + SESSION_DAYS * 86_400_000);
  return `${exp}.${sign(exp)}`;
}

export const SESSION_MAX_AGE = SESSION_DAYS * 86_400;

export async function isAuthed() {
  if (isOpenDemo()) return true;
  if (!authConfigured()) return false;
  const value = (await cookies()).get(ADMIN_COOKIE)?.value ?? "";
  const [exp, mac] = value.split(".");
  if (!exp || !mac || Number(exp) < Date.now()) return false;
  return safeEqual(mac, sign(exp));
}
