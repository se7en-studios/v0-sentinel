"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Ctx } from "../ctx";

const OPEN_KEY = "sentinel.admin.legend.open";
const glass =
  "glass rounded-xl border border-[var(--hairline)] shadow-[var(--shadow-1)]";

const readOpen = () => {
  try {
    return window.localStorage.getItem(OPEN_KEY) === "1";
  } catch {
    return false;
  }
};

function Row({ swatch, children }: { swatch: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span
        className="mt-px grid size-4 shrink-0 place-items-center"
        aria-hidden
      >
        {swatch}
      </span>
      <span className="min-w-0 leading-snug">{children}</span>
    </li>
  );
}

const dot = (size: number, color: string) => (
  <span
    className="rounded-full"
    style={{ width: size, height: size, background: color }}
  />
);
const ring = (color: string, width: number, dashed = false) => (
  <span
    className="size-3.5 rounded-full"
    style={{
      border: `${width}px ${dashed ? "dashed" : "solid"} ${color}`,
      background: "rgba(34,211,238,0.18)",
    }}
  />
);

/** Entries only for what is switched on and actually has something to show. */
function entries(ctx: Ctx): ReactNode[] {
  const { show, view } = ctx;
  const zones = ctx.ws.features.filter((f) =>
    f.properties.mode?.toString().startsWith("zone"),
  ).length;
  const out: ReactNode[] = [];
  if (show.fires)
    out.push(
      <Row key="f" swatch={dot(11, "#d32f1c")}>
        <b>Foco satelital</b> ({ctx.fires.length.toLocaleString("es-AR")}): más
        grande y rojo = más potencia (FRP).
        <span
          className="mt-1 block h-1.5 rounded-full"
          style={{
            background: "linear-gradient(90deg,#f5a524,#ff7a1a,#d32f1c)",
          }}
        />
      </Row>,
    );
  if (show.early && ctx.early.length > 0)
    out.push(
      <Row key="e" swatch={ring("#22d3ee", 2.2)}>
        <b>Alerta temprana</b> (GOES-19): anillo cian grueso = abierta, sin
        confirmar ({ctx.earlyOpen.length}).
      </Row>,
      <Row key="e2" swatch={ring("#7aa6b3", 1.2)}>
        Anillo fino gris = confirmada por un satélite polar.
      </Row>,
    );
  if (show.zones && zones > 0)
    out.push(
      <Row key="z" swatch={dot(11, "#0f7a4f")}>
        <b>Zonas</b> ({zones}): el color indica el riesgo; roja si tiene una
        alerta.
      </Row>,
    );
  if (show.sensors && ctx.sensors.length > 0)
    out.push(
      <Row key="s" swatch={ring("#0e9aa7", 2)}>
        <b>Sensores</b> ({ctx.sensors.length}, simulados).
      </Row>,
    );
  if (show.drones && ctx.drones.length > 0)
    out.push(
      <Row key="d" swatch={dot(10, "#0f7a4f")}>
        <b>Drones</b> ({ctx.drones.length}, simulados).
      </Row>,
    );
  if (view === "3d" && show.fires)
    out.push(
      <Row
        key="3"
        swatch={<span className="h-3.5 w-1.5 rounded-sm bg-[#d32f1c]" />}
      >
        En 3D la altura de la columna sigue a la potencia y el humo va a favor
        del viento.
      </Row>,
    );
  return out;
}

/** Collapsible legend: explains only the symbols that are on screen right now. */
export function MapLegend({ ctx }: { ctx: Ctx }) {
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage only exists on the client
  useEffect(() => setOpen(readOpen()), []);
  const toggle = () => {
    const next = !open;
    setOpen(next);
    try {
      window.localStorage.setItem(OPEN_KEY, next ? "1" : "0");
    } catch {
      /* not remembered */
    }
  };
  const rows = open ? entries(ctx) : [];
  return (
    <div
      className={cn(
        glass,
        "hidden max-w-[15rem] text-[10.5px] text-foreground/70 md:block",
      )}
      role="group"
      aria-label="Leyenda del mapa"
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex h-7 w-full items-center justify-between gap-2 rounded-xl px-2.5 font-medium text-foreground/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex items-center gap-1.5">
          <span
            className="h-1.5 w-6 rounded-full"
            style={{
              background: "linear-gradient(90deg,#f5a524,#ff6a1a,#c8321e)",
            }}
            aria-hidden
          />
          Leyenda
        </span>
        {open ? (
          <ChevronDown className="size-3" aria-hidden />
        ) : (
          <ChevronUp className="size-3" aria-hidden />
        )}
      </button>
      {open && (
        <ul className="space-y-1.5 px-2.5 pb-2.5 pt-1">
          {rows.length ? rows : <li>No hay capas con datos para explicar.</li>}
        </ul>
      )}
    </div>
  );
}
