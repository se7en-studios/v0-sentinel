import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/server/admin-guard";
import { createLimiter } from "@/lib/server/rate-limit";
import { readTerrain } from "@/lib/server/terrain";
import { inArgentina } from "@/lib/server/terrain-batch";

// Vercel function ceiling: slow upstreams must not be cut at the 10 s default
export const maxDuration = 30;

const terrainLimiter = createLimiter(120, 60_000);

const LOOKUP_TIMEOUT_MS = 20_000;

/** Fuel (land cover), elevation and slope under one point, for popups and the incident card. */
export async function GET(req: Request) {
  const denied = await guardAdmin(req, terrainLimiter);
  if (denied) return denied;
  const q = new URL(req.url).searchParams;
  const lat = Number(q.get("lat"));
  const lng = Number(q.get("lng"));
  if (!inArgentina(lat, lng))
    return NextResponse.json(
      { error: "Coordenadas inválidas" },
      { status: 400 },
    );
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    // the COG header read has no abort of its own, so bound the whole lookup here
    const info = await Promise.race([
      readTerrain(lat, lng),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("timeout")),
          LOOKUP_TIMEOUT_MS,
        );
      }),
    ]);
    // an empty answer is usually a tile outage: do not let the browser pin it for a day
    const empty = info.landCover === null && info.elevation === null;
    return NextResponse.json(info, {
      headers: {
        "Cache-Control": empty
          ? "private, max-age=60"
          : "private, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo leer el terreno" },
      { status: 502 },
    );
  } finally {
    clearTimeout(timer);
  }
}
