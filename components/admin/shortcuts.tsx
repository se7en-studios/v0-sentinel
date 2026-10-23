"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Translate } from "@/lib/admin/i18n";
import type { Tab } from "./ctx";
import { openGuide } from "./guide-state";

/** "g" then one of these letters jumps to a screen (the same order as the top bar). */
export const GO_KEYS: Record<string, Tab> = {
  g: "general",
  z: "zonas",
  d: "drones",
  r: "recursos",
  p: "pronostico",
  i: "incidentes",
  m: "metricas",
  c: "config",
};
const CHORD_MS = 1500;

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return Boolean(
    el?.isConnected &&
    (el.isContentEditable ||
      el.closest("input,textarea,select,[contenteditable=true],[role=slider]")),
  );
};

/**
 * "?" opens the help and "g" + letter navigates. Never fires while typing in a field or with a
 * modifier held, and an open menu or dialog keeps the keyboard to itself.
 */
export function useShortcuts({
  goTab,
  toggleHelp,
}: {
  goTab: (t: Tab) => void;
  toggleHelp: () => void;
}) {
  const latest = useRef({ goTab, toggleHelp });
  useEffect(() => {
    latest.current = { goTab, toggleHelp };
  });
  useEffect(() => {
    let armedAt = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.repeat)
        return;
      if (isTyping(e.target)) return;
      if (
        document.querySelector("[role=menu],[role=dialog][data-state=open]")
      ) {
        armedAt = 0;
        return;
      }
      const k = e.key.toLowerCase();
      const armed = Date.now() - armedAt < CHORD_MS;
      armedAt = 0;
      if (armed && GO_KEYS[k]) {
        // capture phase + stop: the drawing tools use the same letters (P, M, R, C)
        e.preventDefault();
        e.stopPropagation();
        latest.current.goTab(GO_KEYS[k]);
      } else if (e.key === "?") {
        e.preventDefault();
        latest.current.toggleHelp();
      } else if (k === "g" && !e.shiftKey) {
        armedAt = Date.now();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);
}

const kbd =
  "mono inline-grid min-w-6 place-items-center rounded border border-[var(--hairline)] bg-card px-1.5 py-0.5 text-[11px] font-medium";

function Keys({ keys, then }: { keys: string[]; then: string }) {
  return (
    <span className="flex shrink-0 items-center gap-1">
      {keys.map((k, i) => (
        <span key={`${i}-${k}`} className="flex items-center gap-1">
          {i > 0 && (
            <span className="text-[10.5px] text-foreground/60">{then}</span>
          )}
          <kbd className={kbd}>{k}</kbd>
        </span>
      ))}
    </span>
  );
}

/** The three shortcut lists (shared by the help dialog and the quick guide). */
export function ShortcutsList({ t }: { t: Translate }) {
  const general: [string[], string][] = [
    [["Ctrl", "K"], t("keys.palette")],
    [["?"], t("keys.help")],
    [["Ctrl", "Z"], t("keys.undo")],
    [["Ctrl", "Shift", "Z"], t("keys.redo")],
    [["Esc"], t("keys.esc")],
  ];
  const go: [string, string][] = [
    ["g", t("tab.general")],
    ["z", t("tab.zonas")],
    ["d", t("tab.drones")],
    ["r", t("tab.recursos")],
    ["p", t("tab.pronostico")],
    ["i", t("tab.incidentes")],
    ["m", t("tab.metricas")],
    ["c", t("tab.config")],
  ];
  const h3 =
    "mb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-foreground/60";
  return (
    <>
      <section>
        <h3 className={h3}>{t("keys.general")}</h3>
        <ul className="space-y-1.5">
          {general.map(([keys, label]) => (
            <li
              key={label}
              className="flex items-center justify-between gap-3 text-[12.5px]"
            >
              <span>{label}</span>
              <Keys keys={keys} then="+" />
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className={h3}>{t("keys.goto")}</h3>
        <ul className="grid grid-cols-1 gap-1.5 min-[420px]:grid-cols-2">
          {go.map(([k, label]) => (
            <li
              key={k}
              className="flex items-center justify-between gap-3 text-[12.5px]"
            >
              <span>{label}</span>
              <Keys keys={["g", k]} then={t("keys.then")} />
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className={h3}>{t("keys.draw")}</h3>
        <p className="text-[12.5px] text-foreground/80">{t("keys.drawHint")}</p>
      </section>
    </>
  );
}

export function ShortcutsHelp({
  open,
  setOpen,
  t,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  t: Translate;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[85dvh] overflow-y-auto sm:max-w-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <DialogTitle className="font-heading text-lg">
              {t("keys.title")}
            </DialogTitle>
            <DialogDescription className="mt-1 text-[12.5px]">
              {t("keys.desc")}
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t("keys.close")}
            className="grid size-9 shrink-0 place-items-center rounded-lg text-foreground/70 hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <ShortcutsList t={t} />
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            openGuide();
          }}
          className="self-start rounded-lg px-1 py-1.5 text-[12.5px] font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t("guide.openFromKeys")}
        </button>
        <a
          href="/demo"
          target="_blank"
          rel="noopener noreferrer"
          className="self-start rounded-lg px-1 py-1.5 text-[12.5px] font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t("pal.presentation")}
        </a>
      </DialogContent>
    </Dialog>
  );
}
