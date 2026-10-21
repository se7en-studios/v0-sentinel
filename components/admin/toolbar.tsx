"use client";

import {
  Circle,
  Pencil,
  Pentagon,
  Radio,
  Route,
  Ruler,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tab } from "./ctx";

const TOOLS: Record<
  string,
  { mode: string; label: string; Icon: typeof Circle }[]
> = {
  zonas: [
    { mode: "zone-polygon", label: "Polígono libre", Icon: Pentagon },
    { mode: "zone-free", label: "Mano alzada", Icon: Pencil },
    { mode: "zone-rect", label: "Rectángulo", Icon: Square },
    { mode: "zone-circle", label: "Círculo (radio)", Icon: Circle },
    { mode: "line", label: "Línea / cortafuego", Icon: Ruler },
  ],
  drones: [
    { mode: "route", label: "Ruta de dron", Icon: Route },
    { mode: "sensor", label: "Colocar sensor", Icon: Radio },
  ],
};

export function Toolbar({
  tab,
  tool,
  setTool,
  editing,
}: {
  tab: Tab;
  tool: string | null;
  setTool: (t: string | null) => void;
  editing: boolean;
}) {
  const items = TOOLS[tab] ?? [];
  return (
    <div
      role="toolbar"
      aria-label="Herramientas de dibujo"
      className="absolute left-3 top-14 flex flex-col gap-1 rounded-lg border border-border bg-background/90 p-1 backdrop-blur"
    >
      {items.map(({ mode, label, Icon }) => {
        const on = tool === mode;
        return (
          <button
            key={mode}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={on}
            disabled={editing}
            onClick={() => setTool(on ? null : mode)}
            className={cn(
              "group relative grid size-10 place-items-center rounded-md text-foreground/75 transition-colors disabled:opacity-40",
              on
                ? "bg-primary text-primary-foreground"
                : "hover:bg-foreground/8 hover:text-foreground",
            )}
          >
            <Icon className="size-[18px]" aria-hidden />
            <span className="pointer-events-none absolute left-12 z-10 hidden whitespace-nowrap rounded bg-[#0c0b09] px-2 py-1 text-[11px] text-white group-hover:block group-focus-visible:block">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
