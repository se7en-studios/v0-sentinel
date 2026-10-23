import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/server/admin-guard";
import { createLimiter } from "@/lib/server/rate-limit";
import { readTerrain } from "@/lib/server/terrain";
import { parseBatch, readBatch } from "@/lib/server/terrain-batch";

export const maxDuration = 30;

// each call can read 25 points, so it gets its own, tighter allowance than the single-point route
const batchLimiter = createLimiter(20, 60_000);
const MAX_BODY_CHARS = 4_000;

/** Land cover, elevation and slope for up to 25 points at once; `results` lines up with `points`. */
export async function POST(req: Request) {
  const denied = await guardAdmin(req, batchLimiter);
  if (denied) return denied;
  const raw = await req.text();
  if (raw.length > MAX_BODY_CHARS)
    return NextResponse.json({ error: "Pedido demasiado grande" }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const points = parseBatch(body);
  if (!points)
    return NextResponse.json(
      { error: "Se esperan de 1 a 25 puntos dentro de Argentina" },
      { status: 400 },
    );
  const results = await readBatch(points, readTerrain);
  return NextResponse.json({ results }, { headers: { "Cache-Control": "no-store" } });
}
