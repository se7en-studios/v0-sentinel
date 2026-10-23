"use client";

import { useEffect } from "react";
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
import type { MsgKey, Translate } from "@/lib/admin/i18n";
import type { Tab } from "./ctx";

const TOOLS: Record<
  string,
  { mode: string; label: MsgKey; key: string; Icon: typeof Circle }[]
> = {
  zonas: [
    { mode: "zone-polygon", label: "tl.zone-polygon", key: "P", Icon: Pentagon },
    { mode: "zone-free", label: "tl.zone-free", key: "M", Icon: Pencil },
    { mode: "zone-rect", label: "tl.zone-rect", key: "R", Icon: Square },
    { mode: "zone-circle", label: "tl.zone-circle", key: "C", Icon: Circle },
    { mode: "line", label: "tl.line", key: "L", Icon: Ruler },
  ],
  drones: [
    { mode: "route", label: "tl.route", key: "R", Icon: Route },
    { mode: "sensor", label: "tl.sensor", key: "S", Icon: Radio },
  ],
};

export function Toolbar({
  tab,
  tool,
  setTool,
  editing,
  t,
}: {
  t: Translate;
  tab: Tab;
  tool: string | null;
  setTool: (t: string | null) => void;
  editing: boolean;
}) {
  const items = TOOLS[tab] ?? [];
  useEffect(() => {
    if (editing) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (
        t &&
        (t.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))
      )
        return;
      const hit = items.find(
        (i) => i.key.toLowerCase() === e.key.toLowerCase(),
      );
      if (!hit) return;
      e.preventDefault();
      setTool(tool === hit.mode ? null : hit.mode);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items, tool, setTool, editing]);
  return (
    <div
      role="toolbar"
      aria-label={t("tl.aria")}
      aria-orientation="vertical"
      className="glass absolute left-3 top-28 z-10 flex flex-col gap-0.5 rounded-xl border border-[var(--hairline)] p-1 shadow-[var(--shadow-1)]"
    >
      {items.map(({ mode, label: labelKey, key, Icon }) => {
        const on = tool === mode;
        const label = t(labelKey);
        return (
          <button
            key={mode}
            type="button"
            aria-label={label}
            aria-pressed={on}
            disabled={editing}
            onClick={() => setTool(on ? null : mode)}
            className={cn(
              "group relative grid size-10 max-md:size-11 place-items-center rounded-lg text-foreground/65 transition-[background-color,color,transform] duration-150 active:scale-95 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              on
                ? "bg-[var(--fire-solid)] text-white shadow-sm"
                : "hover:bg-foreground/[0.07] hover:text-foreground",
            )}
          >
            <Icon className="size-[18px]" aria-hidden />
            <span className="pointer-events-none absolute left-12 z-20 flex items-center gap-2 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-[11px] font-medium text-background opacity-0 shadow-lg transition-opacity duration-100 group-hover:opacity-100 group-focus-visible:opacity-100">
              {label}
              <kbd className="mono rounded bg-background/20 px-1 text-[9.5px]">
                {key}
              </kbd>
            </span>
          </button>
        );
      })}
    </div>
  );
}
