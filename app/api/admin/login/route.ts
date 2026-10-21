import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  SESSION_MAX_AGE,
  newSessionToken,
  passwordMatches,
} from "@/lib/admin/auth";

// ponytail: best-effort limiter, per server instance. On serverless each cold
// instance has its own map, so also add a Vercel Firewall rate limit on
// /api/admin/login for a hard guarantee.
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { n: number; reset: number }>();

function limited(ip: string) {
  const now = Date.now();
  for (const [k, v] of attempts) if (v.reset < now) attempts.delete(k);
  const cur = attempts.get(ip);
  if (!cur || cur.reset < now) {
    attempts.set(ip, { n: 1, reset: now + WINDOW_MS });
    return false;
  }
  cur.n += 1;
  return cur.n > MAX_ATTEMPTS;
}

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Demasiados intentos. Esperá un minuto." },
      { status: 429 },
    );
  }
  const body = (await req.json().catch(() => null)) as {
    password?: unknown;
  } | null;
  const password =
    typeof body?.password === "string" ? body.password.slice(0, 200) : "";
  if (!passwordMatches(password)) {
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json(
      { ok: false, error: "Contraseña incorrecta" },
      { status: 401 },
    );
  }
  attempts.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, newSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
