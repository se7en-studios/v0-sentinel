import { NextResponse } from "next/server";
import { MAX_BODY_BYTES, validateContact } from "@/lib/contact";

export const runtime = "nodejs";

// ponytail: rate limit en memoria por instancia; sirve contra abuso casual.
// Para algo serio, Upstash/Vercel KV.
const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return recent.length > MAX_PER_WINDOW;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function POST(request: Request) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO;
  if (!key || !to) {
    return NextResponse.json(
      { ok: false, error: "El envío en línea no está disponible por ahora." },
      { status: 503 },
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) {
    return NextResponse.json({ ok: false, error: "Demasiados intentos. Probá más tarde." }, { status: 429 });
  }

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "Mensaje demasiado largo." }, { status: 413 });
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const v = validateContact(raw);
  if (!v.ok) return NextResponse.json({ ok: false, errors: v.errors }, { status: 422 });
  // honeypot: fingimos éxito para no dar pistas a bots
  if (v.data.website) return NextResponse.json({ ok: true });

  const d = v.data;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM || "Sentinel Web <onboarding@resend.dev>",
      to: to.split(",").map((s) => s.trim()).filter(Boolean),
      reply_to: d.email,
      subject: `Contacto web: ${d.name}${d.organization ? ` (${d.organization})` : ""}`,
      html: `<p><b>${esc(d.name)}</b> &lt;${esc(d.email)}&gt;</p>
<p>Organización: ${esc(d.organization || "-")} · Interés: ${esc(d.interest ?? "-")}</p>
<p style="white-space:pre-wrap">${esc(d.message)}</p>`,
    }),
  }).catch(() => null);

  if (!res || !res.ok) {
    console.error("contact: resend failed", res?.status);
    return NextResponse.json({ ok: false, error: "No pudimos enviar tu mensaje." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
