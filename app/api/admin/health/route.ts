import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/server/admin-guard";
import { checkHealth } from "@/lib/server/health";
import { createLimiter } from "@/lib/server/rate-limit";

// Vercel function ceiling: slow upstreams must not be cut at the 10 s default
export const maxDuration = 15;

const healthLimiter = createLimiter(12, 60_000);

/** Live status of every external source (latency, freshness). Never echoes keys or upstream URLs. */
export async function GET(req: Request) {
  const denied = await guardAdmin(req, healthLimiter);
  if (denied) return denied;
  const body = await checkHealth(Date.now(), process.env.NASA_FIRMS_KEY);
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
}
