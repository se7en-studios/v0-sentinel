"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  EARLY_TIER_RATE,
  SCAN_MS,
  earlyTier,
  type EarlyTier,
} from "@/lib/admin/early";
import type { MsgKey, Translate } from "@/lib/admin/i18n";
import { setGuideOpen, useGuideOpen } from "./guide-state";
import { ShortcutsList } from "./shortcuts";

/** First scan count that lands in each confidence band (derived from earlyTier, not repeated). */
const tierStart = (tier: EarlyTier) =>
  Array.from({ length: 60 }, (_, i) => i).find((n) => earlyTier(n) === tier) ??
  0;

const dot = (size: number, color: string) => (
  <span
    className="rounded-full"
    style={{ width: size, height: size, background: color }}
  />
);
const ring = (color: string, width: number) => (
  <span
    className="size-3.5 rounded-full"
    style={{
      border: `${width}px solid ${color}`,
      background: "rgba(34,211,238,0.18)",
    }}
  />
);

function Swatch({ children, text }: { children: ReactNode; text: string }) {
  return (
    <li className="flex items-start gap-2">
      <span
        className="mt-0.5 grid size-4 shrink-0 place-items-center"
        aria-hidden
      >
        {children}
      </span>
      <span>{text}</span>
    </li>
  );
}

function Section({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-lg border border-[var(--hairline)] bg-card/60"
    >
      <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown
          className="size-4 shrink-0 text-foreground/60 transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="space-y-2 px-3 pb-3 text-[12.5px] leading-relaxed text-foreground/85">
        {children}
      </div>
    </details>
  );
}

const List = ({ items, t }: { items: MsgKey[]; t: Translate }) => (
  <ul className="list-disc space-y-1.5 pl-4">
    {items.map((k) => (
      <li key={k}>{t(k)}</li>
    ))}
  </ul>
);

function EarlyTiers({ t }: { t: Translate }) {
  const mid = tierStart("mid");
  const high = tierStart("high");
  const pct = (tier: EarlyTier) => Math.round(EARLY_TIER_RATE[tier] * 100);
  return (
    <ul className="list-disc space-y-1 pl-4">
      <li>{t("guide.early.tier.low", { a: mid, p: pct("low") })}</li>
      <li>
        {t("guide.early.tier.mid", { a: mid, b: high - 1, p: pct("mid") })}
      </li>
      <li>{t("guide.early.tier.high", { a: high, p: pct("high") })}</li>
    </ul>
  );
}

function MapLegendSection({ t }: { t: Translate }) {
  return (
    <ul className="space-y-2">
      <Swatch text={t("guide.map.fire")}>{dot(11, "#d32f1c")}</Swatch>
      <Swatch text={t("guide.map.sat")}>{dot(7, "#ff7a1a")}</Swatch>
      <Swatch text={t("guide.map.early")}>{ring("#22d3ee", 2.2)}</Swatch>
      <Swatch text={t("guide.map.early2")}>{ring("#7aa6b3", 1.2)}</Swatch>
      <Swatch text={t("guide.map.zone")}>{dot(11, "#0f7a4f")}</Swatch>
      <Swatch text={t("guide.map.sim")}>{ring("#0e9aa7", 2)}</Swatch>
      <Swatch text={t("guide.map.industrial")}>{dot(9, "#7a7a7a")}</Swatch>
    </ul>
  );
}

/** Accessible quick guide dialog. Opened with openGuide(); mounted once by the command palette. */
export function QuickGuide({ t }: { t: Translate }) {
  const open = useGuideOpen();
  // remount the sections each time so they start collapsed again (first one open)
  const [round, setRound] = useState(0);
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) setRound((r) => r + 1);
        setGuideOpen(v);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[85dvh] overflow-y-auto sm:max-w-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <DialogTitle className="font-heading text-lg">
              {t("guide.title")}
            </DialogTitle>
            <DialogDescription className="mt-1 text-[12.5px]">
              {t("guide.desc")}
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={() => setGuideOpen(false)}
            aria-label={t("guide.close")}
            className="grid size-9 shrink-0 place-items-center rounded-lg text-foreground/70 hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <div key={round} className="space-y-2">
          <Section title={t("guide.map.title")} defaultOpen>
            <MapLegendSection t={t} />
          </Section>
          <Section title={t("guide.data.title")}>
            <p>{t("guide.data.intro")}</p>
            <List
              t={t}
              items={[
                "guide.data.viirs",
                "guide.data.modis",
                "guide.data.backup",
                "guide.data.terrain",
              ]}
            />
            <p>{t("guide.data.goes", { scan: SCAN_MS / 60_000 })}</p>
          </Section>
          <Section title={t("guide.early.title")}>
            <p>{t("guide.early.what")}</p>
            <p>{t("guide.early.tiersIntro")}</p>
            <EarlyTiers t={t} />
            <p>{t("guide.early.caveat")}</p>
          </Section>
          <Section title={t("guide.score.title")}>
            <List
              t={t}
              items={[
                "guide.score.fire",
                "guide.score.industrial",
                "guide.score.fwi",
              ]}
            />
          </Section>
          <Section title={t("guide.sim.title")}>
            <List
              t={t}
              items={["guide.sim.fake", "guide.sim.real", "guide.sim.not"]}
            />
          </Section>
          <Section title={t("guide.store.title")}>
            <List
              t={t}
              items={[
                "guide.store.device",
                "guide.store.cloud",
                "guide.store.nosync",
              ]}
            />
          </Section>
          <Section title={t("keys.title")}>
            <div className="space-y-3">
              <ShortcutsList t={t} />
            </div>
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
