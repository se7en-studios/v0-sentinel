import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/server/admin-guard";
import { loadHistory } from "@/lib/server/history";
import { createLimiter } from "@/lib/server/rate-limit";

// 8 FIRMS requests, 4 at a time, 15 s each and 30 s overall (lib/server/history.ts)
export const maxDuration = 40;

const limiter = createLimiter(20, 60_000);

export async function GET(req: Request) {
  const denied = await guardAdmin(req, limiter);
  if (denied) return denied;
  const key = process.env.NASA_FIRMS_KEY;
  if (!key)
    return NextResponse.json(
      { error: "Falta NASA_FIRMS_KEY en el servidor" },
      { status: 503 },
    );
  try {
    const body = await loadHistory(key);
    return NextResponse.json(body, {
      headers: { "Cache-Control": "private, max-age=1800" },
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo contactar a NASA FIRMS" },
      { status: 502 },
    );
  }
}
