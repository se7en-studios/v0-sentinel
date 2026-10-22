import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  SESSION_MAX_AGE,
  newSessionToken,
  passwordMatches,
} from "@/lib/admin/auth";
import {
  clientIp,
  createLimiter,
  limitResponse,
} from "@/lib/server/rate-limit";

// per IP and per instance (see lib/server/rate-limit.ts for the ceiling)
const loginLimiter = createLimiter(8, 60_000);

export async function POST(req: Request) {
  const limited = limitResponse(loginLimiter, clientIp(req));
  if (limited) return limited;
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
