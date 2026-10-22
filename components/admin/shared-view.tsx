"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { firebaseEnabled } from "@/lib/admin/firebase";
import { loadShare, type LoadedShare } from "@/lib/admin/share";
import { areaHa } from "@/lib/admin/geo";
import { DEFAULT_SETTINGS, MODE_ROLE } from "@/lib/admin/types";
import type { ShowLayers } from "./map-view";
import { NUM_LOCALE } from "@/lib/admin/i18n-shell";
import type { Locale } from "@/lib/admin/i18n";
import { useStoredT } from "./use-stored-t";

const MapView = dynamic(() => import("./map-view").then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center bg-[var(--surface-2)] text-[12px] text-foreground/50">
      Cargando mapa
    </div>
  ),
});

const SHOW: ShowLayers = {
  fires: true,
  early: false,
  heat: true,
  zones: true,
  lines: true,
  routes: true,
  sensors: true,
  drones: false,
  names: true,
  spread: false,
  forest: true,
  buildings: true,
};
const NOOP = () => {};
const fmt = (n: number, loc: Locale) => n.toLocaleString(NUM_LOCALE[loc]);
const day = (ms: number, loc: Locale) =>
  new Date(ms).toLocaleDateString(NUM_LOCALE[loc], { day: "numeric", month: "long" });

type State = { s: "loading" } | { s: "gone" } | { s: "ok"; share: LoadedShare };

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#faf7f0] px-6 text-center text-[#1a1812]">
      <div className="max-w-sm">
        <h1 className="font-heading text-xl font-bold">{title}</h1>
        <p className="mt-2 text-[14px] text-[#1a1812]/65">{text}</p>
      </div>
    </main>
  );
}

/** Public, read-only page for a share link. Shows a frozen snapshot, never live data. */
export function SharedView({ token }: { token: string }) {
  const { t, locale } = useStoredT();
  const [st, setSt] = useState<State>({ s: "loading" });
  const [view, setView] = useState<"2d" | "3d">("2d");

  useEffect(() => {
    if (!firebaseEnabled) return setSt({ s: "gone" });
    let live = true;
    loadShare(token)
      .then(
        (share) => live && setSt(share ? { s: "ok", share } : { s: "gone" }),
      )
      .catch(() => live && setSt({ s: "gone" }));
    return () => {
      live = false;
    };
  }, [token]);

  const share = st.s === "ok" ? st.share : null;
  const stats = useMemo(() => {
    if (!share) return null;
    const zones = share.features.filter(
      (f) => MODE_ROLE[String(f.properties.mode)] === "zone",
    );
    const frp = share.fires.length
      ? Math.round(
          share.fires.reduce((a, p) => a + p[2], 0) / share.fires.length,
        )
      : 0;
    return {
      zones: zones.map((z) => ({
        id: z.id as string,
        name: share.meta[z.id as string]?.name ?? t("share.zoneDefault"),
        ha: areaHa(z),
      })),
      frp,
      totalHa: zones.reduce((a, z) => a + areaHa(z), 0),
    };
  }, [share, t]);

  if (st.s === "loading")
    return (
      <main className="grid min-h-dvh place-items-center bg-[#faf7f0] text-[13px] text-[#1a1812]/60">
        {t("share.loading")}
      </main>
    );
  if (!share || !stats)
    return (
      <Notice
        title={t("share.goneTitle")}
        text={t("share.goneText")}
      />
    );

  return (
    <div className="admin-root fixed inset-0 flex flex-col bg-background text-foreground">
      <header className="flex h-11 shrink-0 items-center gap-3 border-b border-[var(--hairline)] bg-card px-3">
        <span className="text-[13px] font-semibold tracking-wide text-primary">
          SENTINEL
        </span>
        <span className="truncate text-[12.5px] font-medium">{share.org}</span>
        <span className="rounded-md bg-foreground/[0.07] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/60">
          {t("share.readOnly")}
        </span>
        <span className="ml-auto hidden text-[11px] text-foreground/50 sm:block">
          {t("share.snapshot", { from: day(share.createdAt, locale), to: day(share.expiresAt, locale) })}
        </span>
      </header>
      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="relative h-[58vh] min-h-[320px] shrink-0 lg:h-auto lg:flex-1">
          <MapView
            baseLayer={share.baseLayer}
            region={{ id: "shared", ...share.region }}
            view={view}
            exaggeration={DEFAULT_SETTINGS.exaggeration}
            features={share.features}
            meta={share.meta}
            alertIds={new Set()}
            fires={share.fires}
            dayLabels={share.days}
            show={SHOW}
            spread={null}
            orbit={false}
            follow={null}
            zoneRisk={{}}
            opacity={DEFAULT_SETTINGS.opacity}
            wind={{ dir: 270, speed: 12 }}
            tool={null}
            selectedId={null}
            editing={false}
            drones={[]}
            units="ha"
            onSelect={NOOP}
            onCreate={NOOP}
            onEdited={NOOP}
            onLive={NOOP}
            onCenter={NOOP}
          />
          <div
            className="glass absolute left-3 top-3 z-10 flex rounded-xl border border-[var(--hairline)] p-0.5 text-[12px] font-medium shadow-[var(--shadow-1)]"
            role="group"
            aria-label={t("share.mapView")}
          >
            {(["2d", "3d"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={cn(
                  "rounded-lg px-3 py-1.5 transition-colors",
                  view === v
                    ? "bg-[var(--fire)] text-white"
                    : "text-foreground/60 hover:text-foreground",
                )}
              >
                {v.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <aside
          aria-label={t("share.summary")}
          className="w-full shrink-0 overflow-y-auto border-t border-[var(--hairline)] bg-card p-4 lg:w-80 lg:border-l lg:border-t-0"
        >
          <dl className="grid grid-cols-3 gap-3">
            {[
              [t("share.fires"), fmt(share.fires.length, locale)],
              [t("share.frp"), `${stats.frp} MW`],
              [t("share.zones"), fmt(stats.zones.length, locale)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-foreground/45">
                  {k}
                </dt>
                <dd className="num text-[18px] font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <h2 className="mb-1 mt-5 text-[10px] font-semibold uppercase tracking-[0.1em] text-foreground/45">
            {t("share.zonesWatched", { ha: fmt(Math.round(stats.totalHa), locale) })}
          </h2>
          <ul>
            {stats.zones.map((z) => (
              <li
                key={z.id}
                className="flex justify-between gap-2 border-b border-[var(--hairline)] py-1.5 text-[12.5px] last:border-0"
              >
                <span className="truncate">{z.name}</span>
                <span className="num shrink-0 text-foreground/55">
                  {fmt(Math.round(z.ha), locale)} ha
                </span>
              </li>
            ))}
            {stats.zones.length === 0 && (
              <li className="py-2 text-[12px] text-foreground/45">
                {t("share.noZones")}
              </li>
            )}
          </ul>
          <p className="mt-5 text-[10.5px] leading-snug text-foreground/45">
            {t("share.note")}
          </p>
        </aside>
      </main>
    </div>
  );
}
