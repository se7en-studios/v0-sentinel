import { NextResponse } from "next/server";
import { allowed } from "@/lib/server/admin-guard";
import { readTerrain } from "@/lib/server/terrain";

// Argentina's bounding box (see AR_BBOX): the rasters are read per point, so keep the scope tight.
const LAT = [-56, -21] as const;
const LNG = [-74, -52] as const;
const LOOKUP_TIMEOUT_MS = 20_000;

/** Fuel (land cover), elevation and slope under one point, for popups and the incident card. */
export async function GET(req: Request) {
  if (!(await allowed(req)))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const q = new URL(req.url).searchParams;
  const lat = Number(q.get("lat"));
  const lng = Number(q.get("lng"));
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < LAT[0] ||
    lat > LAT[1] ||
    lng < LNG[0] ||
    lng > LNG[1]
  )
    return NextResponse.json(
      { error: "Coordenadas inválidas" },
      { status: 400 },
    );
  try {
    // the COG header read has no abort of its own, so bound the whole lookup here
    const info = await Promise.race([
      readTerrain(lat, lng),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), LOOKUP_TIMEOUT_MS),
      ),
    ]);
    return NextResponse.json(info, {
      headers: { "Cache-Control": "private, max-age=86400" },
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo leer el terreno" },
      { status: 502 },
    );
  }
}
