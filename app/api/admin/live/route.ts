import { NextResponse } from "next/server";
import { parseFirmsCsv } from "@/lib/engine/firms";
import { buildLive } from "@/lib/live";
import { argentinaOutline, nationalCover } from "@/lib/server/static-data";
import type { LiveBundle } from "@/lib/incident";
import { guardAdmin } from "@/lib/server/admin-guard";
import { createLimiter } from "@/lib/server/rate-limit";

// NOAA-20 + NOAA-21 only: S-NPP stops delivering on 2026-11-01 (same as Sentinel PR #8)
const SOURCES = ["VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT"];
const AR_BBOX = "-74,-56,-52,-21";
const WINDOW_DAYS = 10;
const CACHE_S = 1800;

// the same session check and rate limit as /api/admin/fires
const liveLimiter = createLimiter(30, 60_000);

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// one build per instance per half hour, on top of the CDN cache
let memo: { at: number; bundle: LiveBundle } | null = null;

export async function GET(req: Request) {
  const denied = await guardAdmin(req, liveLimiter);
  if (denied) return denied;
  const key = process.env.NASA_FIRMS_KEY;
  if (!key) return NextResponse.json({ error: "Falta NASA_FIRMS_KEY en el servidor" }, { status: 503 });

  if (memo && Date.now() - memo.at < CACHE_S * 1000) return respond(memo.bundle);

  const older = new Date(Date.now() - 9 * 86_400_000).toISOString().slice(0, 10);
  const urls = SOURCES.flatMap((s) => [
    `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/${s}/${AR_BBOX}/5`,
    `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/${s}/${AR_BBOX}/5/${older}`,
  ]);
  let texts: string[];
  try {
    texts = await Promise.all(urls.map((u) => fetch(u, { cache: "no-store" }).then((r) => (r.ok ? r.text() : ""))));
  } catch {
    return NextResponse.json({ error: "No se pudo contactar a NASA FIRMS" }, { status: 502 });
  }
  const valid = texts.filter((t) => t.startsWith("latitude"));
  if (valid.length === 0) return NextResponse.json({ error: "NASA FIRMS no respondió datos válidos" }, { status: 502 });

  const bundle = buildLive({
    detections: valid.flatMap(parseFirmsCsv),
    windowEnd: Date.now(),
    windowDays: WINDOW_DAYS,
    sources: SOURCES,
    origin: "api",
    argentina: argentinaOutline(),
    landCover: nationalCover(),
  });
  memo = { at: Date.now(), bundle };
  return respond(bundle);
}

function respond(bundle: LiveBundle) {
  return NextResponse.json(bundle, {
    // behind the admin session, so no shared cache: the in-memory memo above does the sharing
    headers: { "Cache-Control": `private, max-age=${CACHE_S}` },
  });
}
