"use client";

// A tab strip that never clips. The tabs that don't fit go into a "Más"
// menu, and the active one always stays in view. Same look as the strip in
// topbar.tsx, measured with a hidden twin of the buttons. Labels come from
// the interface language (tab.<id> and tab.<id>.short in lib/admin/i18n.ts).

import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Translate } from "@/lib/admin/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Tab } from "../ctx";
import { TABS } from "../tabs";
import { layoutTabs } from "@/lib/admin/tab-layout";

export interface TabBadge {
  n: number;
  tone: "fire" | "ok";
}

const MORE_W = 74; // the "Más" button
const BTN = "h-8 max-lg:h-11 max-md:h-9";

interface Measure {
  widths: Record<string, number>;
  avail: number;
}

const sameMeasure = (a: Measure, b: Measure) =>
  a.avail === b.avail && TABS.every((x) => a.widths[x.id] === b.widths[x.id]);

export function TabStrip({
  tab,
  goTab,
  badge,
  t,
  simple = false,
}: {
  tab: Tab;
  goTab: (t: Tab) => void;
  badge: (id: Tab) => TabBadge | null;
  t: Translate;
  /** only the essential tabs in the bar; the rest under "Más" */
  simple?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const ghost = useRef<HTMLDivElement>(null);
  // before the first measurement everything is assumed to fit, so the server render shows the full bar
  const [m, setM] = useState<Measure>({ widths: {}, avail: Number.POSITIVE_INFINITY });

  useLayoutEffect(() => {
    const el = box.current;
    const g = ghost.current;
    if (!el || !g) return;
    const measure = () => {
      const next: Measure = {
        widths: Object.fromEntries(TABS.map((x, i) => [x.id, ((g.children[i] as HTMLElement | undefined)?.offsetWidth ?? 0) + 2])),
        avail: el.clientWidth,
      };
      setM((prev) => (sameMeasure(prev, next) ? prev : next));
    };
    measure();
    // the twin changes width without the box changing (language switch, web font arriving): watch both
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(g);
    let alive = true;
    document.fonts?.ready.then(() => alive && measure());
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, []);

  const { visible: visibleIds, hidden: hiddenIds } = layoutTabs({
    tabs: TABS,
    simple,
    widths: m.widths,
    avail: m.avail,
    moreW: MORE_W,
    active: tab,
  });
  const visible = visibleIds.map((id) => TABS.find((x) => x.id === id)!);
  const hidden = hiddenIds.map((id) => TABS.find((x) => x.id === id)!);

  // a render helper, not a component: a component declared here is a new type on every render, so React
  // would remount every button each time (lost focus and hover, and a button that moves under a click)
  const item = (id: Tab, ghostly = false) => {
    const b = badge(id);
    const on = !ghostly && tab === id;
    return (
      <button
        key={ghostly ? `g-${id}` : id}
        type="button"
        tabIndex={ghostly ? -1 : undefined}
        onClick={ghostly ? undefined : () => goTab(id)}
        aria-current={on ? "page" : undefined}
        className={cn(
          `relative flex ${BTN} shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`,
          on
            ? "bg-primary text-primary-foreground"
            : "text-foreground/60 hover:bg-foreground/[0.06] hover:text-foreground",
        )}
      >
        <span className="hidden lg:inline">{t(`tab.${id}`)}</span>
        <span className="lg:hidden">{t(`tab.${id}.short`)}</span>
        {b && b.n > 0 && (
          <span
            className={cn(
              "num grid min-w-4 place-items-center rounded-full px-1 text-[9.5px] font-bold leading-4 text-white",
              b.tone === "fire" ? "bg-[#d8402f]" : "bg-primary",
            )}
          >
            {b.n}
          </span>
        )}
      </button>
    );
  };

  return (
    <div
      ref={box}
      className="relative mx-1 flex min-w-0 flex-1 items-center justify-center gap-0.5 max-md:order-last max-md:mx-0 max-md:basis-full max-md:flex-none max-md:border-t max-md:border-[var(--hairline)] max-md:py-1"
      role="navigation"
      aria-label={t("top.modes")}
    >
      {visible.map((x) => item(x.id))}
      {hidden.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            className={`flex ${BTN} shrink-0 items-center gap-1 rounded-lg px-2.5 text-[12px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-foreground/[0.06] data-[state=open]:text-foreground`}
          >
            {t("tab.more")}{" "}
            <ChevronDown className="size-3 opacity-50" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-52 rounded-xl border-[var(--hairline)] p-1.5 shadow-[var(--shadow-2)]"
          >
            {hidden.map((x) => {
              const b = badge(x.id);
              return (
                <DropdownMenuItem
                  key={x.id}
                  onSelect={() => goTab(x.id)}
                  className="rounded-md text-[12.5px]"
                >
                  {t(`tab.${x.id}`)}
                  {b && b.n > 0 && (
                    <span
                      className={cn(
                        "num ml-auto grid min-w-4 place-items-center rounded-full px-1 text-[9.5px] font-bold leading-4 text-white",
                        b.tone === "fire" ? "bg-[#d8402f]" : "bg-primary",
                      )}
                    >
                      {b.n}
                    </span>
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {/* hidden twin, only to measure how wide each tab wants to be */}
      <div
        aria-hidden
        className="pointer-events-none invisible absolute inset-x-0 top-0 h-0 overflow-hidden"
      >
        <div ref={ghost} className="flex w-max gap-0.5">
          {TABS.map((x) => item(x.id, true))}
        </div>
      </div>
    </div>
  );
}
