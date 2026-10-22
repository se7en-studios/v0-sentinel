"use client";

import { Activity } from "lucide-react";
import type { ActivityKind } from "@/lib/admin/activity";
import { useActivity } from "./hooks/use-activity";
import { Badge, Card } from "./ui";

const KIND_LABEL: Record<ActivityKind, string> = {
  zone: "Zona",
  rule: "Regla",
  early: "Temprana",
  sensor: "Sensor",
};

const clock = (t: number) =>
  new Date(t).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

/** Notices the panel raised this session; a toast is gone in seconds, this is not. */
export function ActivityCard() {
  const list = useActivity();
  return (
    <Card bare title="Actividad de la sesión" right={<Badge>{list.length}</Badge>}>
      {list.length === 0 ? (
        <p className="text-[12px] leading-snug text-foreground/60">
          Acá queda el historial de los avisos que levantó el panel (zonas, reglas, alertas
          tempranas y sensores) mientras tengas la pestaña abierta.
        </p>
      ) : (
        <ol className="space-y-1.5" aria-label="Avisos de la sesión">
          {list.map((a) => (
            <li key={a.id} className="rounded-lg border border-[var(--hairline)] p-2 text-[12px]">
              <div className="flex items-center justify-between gap-2 text-[10.5px] text-foreground/55">
                <span className="inline-flex items-center gap-1">
                  <Activity className="size-3" aria-hidden /> {KIND_LABEL[a.kind]}
                </span>
                <span className="num" title={new Date(a.t).toLocaleString("es-AR")}>
                  {clock(a.t)}
                </span>
              </div>
              <div className="mt-0.5 font-semibold">{a.title}</div>
              <div className="text-foreground/65">{a.detail}</div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
