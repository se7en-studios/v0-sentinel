"use client";

import { useState } from "react";
import { BellOff, Radar } from "lucide-react";
import { centerOf } from "@/lib/admin/geo";
import { earlyKey, isAcked, pendingEarly, zoneKey } from "@/lib/admin/alert-ack";
import { NOTE_TEXT_MAX } from "@/lib/admin/store";
import type { Feat } from "@/lib/admin/types";
import type { Ctx } from "./ctx";
import { TerrainCard } from "./terrain-card";
import { Btn, KV } from "./ui";

const SNOOZE_LONG_MIN = 24 * 60;
const NOTES_SHOWN = 3;

const ago = (t: number, now: number) => {
  const m = Math.max(0, Math.round((now - t) / 60_000));
  return m < 90 ? `hace ${m} min` : m < 2880 ? `hace ${Math.round(m / 60)} h` : `hace ${Math.round(m / 1440)} d`;
};

const when = (t: number) =>
  new Date(t).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Everything an operator wants to know about a zone in one place: detections, early warnings, terrain, weather, mute and notes. */
export function ZoneDetail({ ctx, f }: { ctx: Ctx; f: Feat }) {
  const [draft, setDraft] = useState("");
  const hits = ctx.zoneHits[f.id];
  const early = ctx.earlyByZone[f.id] ?? [];
  const pending = pendingEarly(early, ctx.alertAck, ctx.now).length;
  const ack = ctx.alertAck[zoneKey(f.id)];
  const muted = isAcked(ack, hits?.recent ?? 0, ctx.now);
  const wx = ctx.zoneRisk[f.id]?.wx;
  const [lng, lat] = centerOf(f);
  const notes = ctx.noteLog.filter((n) => n.featId === f.id);
  const add = () => {
    if (!draft.trim()) return;
    ctx.addNote(draft, f.id);
    setDraft("");
  };
  return (
    <div className="space-y-3 rounded-md border border-[var(--hairline)] p-2.5">
      <div className="text-[11.5px] font-semibold text-foreground/70">Ficha de la zona</div>
      <dl className="space-y-1 text-[12px]">
        <KV k="Detecciones">{`${hits?.recent ?? 0} en 48 h · ${hits?.total ?? 0} en 10 d`}</KV>
        <KV k="Última detección">{hits && hits.last > 0 ? ago(hits.last, ctx.now) : "ninguna"}</KV>
        {wx && (
          <KV k="Clima">
            {`${Math.round(wx.temp)}° · ${Math.round(wx.rh)}% HR · viento ${Math.round(wx.wind)} km/h · lluvia 7 d ${Math.round(wx.rain7d)} mm`}
          </KV>
        )}
      </dl>
      <div className="flex items-start gap-1.5 text-[12px]">
        <Radar className="mt-0.5 size-3.5 shrink-0 text-[#0e9aa7]" aria-hidden />
        {early.length === 0 ? (
          <span className="text-foreground/65">Sin alertas tempranas cerca.</span>
        ) : (
          <span>
            {early.length} {early.length === 1 ? "alerta temprana" : "alertas tempranas"} de GOES-19 cerca
            {pending < early.length && ` (${early.length - pending} ya reconocidas)`}
            {pending > 0 && (
              <>
                {" "}
                <button
                  type="button"
                  className="font-medium text-primary underline underline-offset-2"
                  onClick={() => {
                    for (const e of early) if (!ctx.alertAck[earlyKey(e)]) ctx.ackEarly(e);
                  }}
                >
                  Reconocerlas
                </button>
              </>
            )}
          </span>
        )}
      </div>
      <TerrainCard ctx={ctx} lat={lat} lng={lng} />
      <div className="flex flex-wrap items-center gap-1.5 text-[11.5px]">
        <BellOff className="size-3.5 text-foreground/50" aria-hidden />
        {muted ? (
          <>
            <span className="text-foreground/65">
              Silenciada por <b>{ack?.by || "Operador"}</b> · {when(ack?.t ?? 0)}
            </span>
            <Btn className="min-h-7" onClick={() => ctx.reopenZoneAlert(f.id)}>
              Reabrir
            </Btn>
          </>
        ) : (
          <>
            <Btn className="min-h-7" onClick={() => ctx.ackZoneAlert(f.id, hits?.recent ?? 0, 60)}>
              Silenciar 1 h
            </Btn>
            <Btn className="min-h-7" onClick={() => ctx.ackZoneAlert(f.id, hits?.recent ?? 0, SNOOZE_LONG_MIN)}>
              Silenciar 24 h
            </Btn>
          </>
        )}
      </div>
      <div>
        <label htmlFor={`zone-note-${f.id}`} className="text-[11.5px] font-medium text-foreground/70">
          Notas de esta zona
        </label>
        <div className="mt-1 flex gap-1.5">
          <input
            id={`zone-note-${f.id}`}
            value={draft}
            maxLength={NOTE_TEXT_MAX}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Qué pasó en esta zona…"
            className="min-w-0 flex-1 rounded-lg border border-[var(--hairline)] bg-card px-2 py-1.5 text-[12px] outline-none focus:border-primary focus:ring-2 focus:ring-ring"
          />
          <Btn variant="solid" onClick={add} disabled={!draft.trim()}>
            Agregar
          </Btn>
        </div>
        {notes.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {notes.slice(0, NOTES_SHOWN).map((n) => (
              <li key={n.id} className="rounded-md bg-foreground/[0.04] p-1.5 text-[12px] leading-snug">
                <span className="block text-[10.5px] text-foreground/50">
                  {n.by || "Operador"} · {when(n.t)}
                </span>
                {n.text}
              </li>
            ))}
            {notes.length > NOTES_SHOWN && (
              <li className="text-[11px] text-foreground/50">y {notes.length - NOTES_SHOWN} más en Notas</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
