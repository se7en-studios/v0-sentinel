import { NextResponse } from "next/server";
import { mergeEarly, type RawGoes } from "@/lib/admin/early";
import type { EarlyPayload, SourceStatus } from "@/lib/admin/types";
import { guardAdmin } from "@/lib/server/admin-guard";
import { createLimiter } from "@/lib/server/rate-limit";
import { inArgentina } from "@/lib/server/argentina";
import {
  fetchFirmsGoes,
  fetchInpeGoes,
  type GoesFeed,
} from "@/lib/server/early-sources";

// Vercel function ceiling: slow upstreams must not be cut at the 10 s default
export const maxDuration = 30;

const earlyLimiter = createLimiter(30, 60_000);

const status = (
  id: string,
  label: string,
  feed: GoesFeed,
  rows: RawGoes[],
): SourceStatus => ({
  id,
  label,
  ok: feed.ok,
  count: rows.length,
  ...(rows.length && { newestAt: Math.max(...rows.map((r) => r.at)) }),
  ...(feed.error && { error: feed.error }),
});

/** GOES-19 early detections (20 min of delay) from two independent feeds, merged per spot. */
export async function GET(req: Request) {
  const denied = await guardAdmin(req, earlyLimiter);
  if (denied) return denied;
  const fetchedAt = Date.now();
  const key = process.env.NASA_FIRMS_KEY;
  const [firms, inpe] = await Promise.all([
    key
      ? fetchFirmsGoes(key)
      : Promise.resolve<GoesFeed>({
          ok: false,
          rows: [],
          error: "Falta NASA_FIRMS_KEY en el servidor",
        }),
    fetchInpeGoes(fetchedAt),
  ]);
  if (!firms.ok && !inpe.ok)
    return NextResponse.json(
      { error: "Ninguna fuente GOES respondió" },
      { status: 502 },
    );
  const inAr = (r: RawGoes) => inArgentina(r.lat, r.lng);
  const firmsRows = firms.rows.filter(inAr);
  const inpeRows = inpe.rows.filter(inAr);
  const body: EarlyPayload = {
    updated: new Date(fetchedAt).toISOString(),
    fetchedAt,
    early: mergeEarly([...firmsRows, ...inpeRows], fetchedAt),
    sources: [
      status("goes-firms", "GOES-19 · NASA FIRMS", firms, firmsRows),
      status("goes-inpe", "GOES-19 · INPE", inpe, inpeRows),
    ],
  };
  return NextResponse.json(body, {
    headers: { "Cache-Control": "private, max-age=120" },
  });
}
