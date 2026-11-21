import { NextResponse } from "next/server";
import { parseFireRows } from "@/lib/admin/fires-parse";
import { fetchFirmsCsv } from "@/lib/firms";
import { AR_BBOX, inArgentina } from "@/lib/server/argentina";
import { notifyBody, sendNotice } from "@/lib/server/notify";
import { nationalCover, peopleAround } from "@/lib/server/static-data";
import { cronAuthorized, exposedFires, watchConfig, watchMessage } from "@/lib/server/watch";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

const FIRMS_TIMEOUT_MS = 12_000;

/** land cover lookup, or none when the WorldCover grid is missing from the bundle */
function coverAt() {
  try {
    return nationalCover();
  } catch {
    return undefined;
  }
}

/**
 * Fresh fires near people, announced through the notify channels (allow-listed recipients only).
 * Bearer CRON_SECRET; `?dryRun=1` builds the message and checks the channels without sending.
 */
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET)
    return NextResponse.json({ error: "Falta CRON_SECRET en el servidor" }, { status: 503 });
  if (!cronAuthorized(req.headers.get("authorization"), process.env.CRON_SECRET))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const key = process.env.NASA_FIRMS_KEY;
  if (!key) return NextResponse.json({ error: "Falta NASA_FIRMS_KEY en el servidor" }, { status: 503 });

  const dryRun = new URL(req.url).searchParams.get("dryRun") === "1";
  const now = Date.now();
  const csv = await fetchFirmsCsv(
    (source) => `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/${source}/${AR_BBOX}/5`,
    { cache: "no-store", signal: AbortSignal.timeout(FIRMS_TIMEOUT_MS) },
  );
  if (csv === null) return NextResponse.json({ error: "NASA FIRMS no respondió" }, { status: 502 });

  const rows = parseFireRows(csv, "viirs").filter((r) => inArgentina(r.lat, r.lng));
  // five days of history so fixed heat sources are recognised; only the window's detections are new
  const fires = exposedFires(rows, now, watchConfig(process.env), peopleAround, coverAt());
  if (fires.length === 0) return NextResponse.json({ detections: rows.length, fires: 0, sent: false });

  const { title, message } = watchMessage(fires);
  // through the same schema as the panel, so the limits (120/1000 chars, https link) hold here too
  const results = await sendNotice(notifyBody.parse({
    title,
    message,
    severity: fires.some((f) => f.people.km5 >= 10_000) ? "critical" : "warning",
    ...(process.env.WATCH_LINK?.startsWith("https://") && { link: process.env.WATCH_LINK }),
    dryRun,
  }));
  return NextResponse.json({
    detections: rows.length,
    fires: fires.length,
    sent: !dryRun,
    // the message carries no personal data (place names and grid estimates only)
    ...(dryRun && { title, message }),
    results,
  });
}
