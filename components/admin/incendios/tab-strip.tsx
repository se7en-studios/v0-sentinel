"use client";

// A tab strip that never clips. The tabs that don't fit go into a "Más"
// menu, and the active one always stays in view. Same look as the strip in
// topbar.tsx, measured with a hidden twin of the buttons. Labels come from
// the interface language (tab.<id> and tab.<id>.short in lib/admin/i18n.ts).

import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Translate } from "@/lib/admin/i18n";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Tab } from "../ctx";
import { TABS } from "../tabs";

export interface TabBadge {
  n: number;
  tone: "fire" | "ok";
}

const MORE_W = 74; // the "Más" button
const BTN = "h-8 max-lg:h-11 max-md:h-9";

export function TabStrip({ tab, goTab, badge, t }: { tab: Tab; goTab: (t: Tab) => void; badge: (id: Tab) => TabBadge | null; t: Translate }) {
  const box = useRef<HTMLDivElement>(null);
  const ghost = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(TABS.length);

  useLayoutEffect(() => {
    const el = box.current;
    const g = ghost.current;
    if (!el || !g) return;
    const measure = () => {
      const widths = [...g.children].map((c) => (c as HTMLElement).offsetWidth + 2);
      const avail = el.clientWidth;
      if (widths.reduce((s, w) => s + w, 0) <= avail) return setFit(TABS.length);
      let used = MORE_W;
      let n = 0;
      for (const w of widths) {
        if (used + w > avail) break;
        used += w;
        n++;
      }
      setFit(Math.max(1, n));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  let visible = TABS.slice(0, fit);
  let hidden = TABS.slice(fit);
  if (hidden.some((x) => x.id === tab)) {
    // the active tab trades places with the last visible one
    const last = visible[visible.length - 1];
    visible = [...visible.slice(0, -1), TABS.find((x) => x.id === tab)!];
    hidden = TABS.filter((x) => (x.id === last.id || hidden.some((h) => h.id === x.id)) && x.id !== tab);
  }

  const Item = ({ id, ghostly }: { id: Tab; ghostly?: boolean }) => {
    const b = badge(id);
    const on = !ghostly && tab === id;
    return (
      <button
        type="button"
        tabIndex={ghostly ? -1 : undefined}
        onClick={ghostly ? undefined : () => goTab(id)}
        aria-current={on ? "page" : undefined}
        className={cn(
          `relative flex ${BTN} shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`,
          on ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:bg-foreground/[0.06] hover:text-foreground",
        )}
      >
        <span className="hidden lg:inline">{t(`tab.${id}`)}</span>
        <span className="lg:hidden">{t(`tab.${id}.short`)}</span>
        {b && b.n > 0 && (
          <span className={cn("num grid min-w-4 place-items-center rounded-full px-1 text-[9.5px] font-bold leading-4 text-white", b.tone === "fire" ? "bg-[#d8402f]" : "bg-primary")}>
            {b.n}
          </span>
        )}
      </button>
    );
  };

  return (
    <div ref={box} className="relative mx-1 flex min-w-0 flex-1 items-center justify-center gap-0.5 max-md:order-last max-md:mx-0 max-md:basis-full max-md:flex-none max-md:border-t max-md:border-[var(--hairline)] max-md:py-1" role="navigation" aria-label={t("top.modes")}>
      {visible.map((x) => (
        <Item key={x.id} id={x.id} />
      ))}
      {hidden.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger className={`flex ${BTN} shrink-0 items-center gap-1 rounded-lg px-2.5 text-[12px] font-medium text-foreground/60 transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-foreground/[0.06] data-[state=open]:text-foreground`}>
            {t("tab.more")} <ChevronDown className="size-3 opacity-50" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-xl border-[var(--hairline)] p-1.5 shadow-[var(--shadow-2)]">
            {hidden.map((x) => {
              const b = badge(x.id);
              return (
                <DropdownMenuItem key={x.id} onSelect={() => goTab(x.id)} className="rounded-md text-[12.5px]">
                  {t(`tab.${x.id}`)}
                  {b && b.n > 0 && (
                    <span className={cn("num ml-auto grid min-w-4 place-items-center rounded-full px-1 text-[9.5px] font-bold leading-4 text-white", b.tone === "fire" ? "bg-[#d8402f]" : "bg-primary")}>
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
      <div aria-hidden className="pointer-events-none invisible absolute inset-x-0 top-0 h-0 overflow-hidden">
        <div ref={ghost} className="flex w-max gap-0.5">
          {TABS.map((x) => (
            <Item key={x.id} id={x.id} ghostly />
          ))}
        </div>
      </div>
    </div>
  );
}
