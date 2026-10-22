import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/server/admin-guard";
import { notifyBody, sendNotice } from "@/lib/server/notify";
import { createLimiter } from "@/lib/server/rate-limit";

// Vercel function ceiling: slow upstreams must not be cut at the 10 s default
export const maxDuration = 20;

const MAX_BODY_BYTES = 16_384;
const notifyLimiter = createLimiter(10, 60_000);

/**
 * Server-side notices. Channels switch on by env vars only (docs/INTEGRACIONES.md).
 * `dryRun: true` validates and reports what would go out without sending anything.
 */
export async function POST(req: Request) {
  const denied = await guardAdmin(req, notifyLimiter);
  if (denied) return denied;
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES)
    return NextResponse.json(
      { error: "Cuerpo demasiado grande" },
      { status: 413 },
    );
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "El cuerpo no es JSON válido" },
      { status: 400 },
    );
  }
  const parsed = notifyBody.safeParse(json);
  if (!parsed.success)
    return NextResponse.json(
      {
        error: "Datos inválidos",
        fields: [
          ...new Set(
            parsed.error.issues.map((i) => i.path.join(".") || "(cuerpo)"),
          ),
        ],
      },
      { status: 400 },
    );
  const results = await sendNotice(parsed.data);
  return NextResponse.json(
    { dryRun: parsed.data.dryRun, results },
    { headers: { "Cache-Control": "no-store" } },
  );
}
