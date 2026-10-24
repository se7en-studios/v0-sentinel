"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { useAdmin, type CloudSession } from "./use-admin";
import { Topbar } from "./topbar";
import { MapOverlays } from "./map-controls";
import { CommandPalette } from "./command-palette";
import { GeneralPanel } from "./panel-general";
import { DronesPanel, ZonesPanel } from "./panel-draw";
import { ResourcesPanel } from "./panel-resources";
import { TimelineDock } from "./dock-timeline";
import { DroneDock, ResourcesDock } from "./docks";
import { DronePip } from "./drone-pip";
import { SettingsView } from "./settings-view";
import { ShortcutsHelp, useShortcuts } from "./shortcuts";
import { storeLocale } from "./use-stored-t";
import { ViewSkeleton } from "./ui";
import { GuidedTour } from "./tour";
import { StatusStrip } from "./status-strip";
import { BackupNotice } from "./backup-notice";
import { ConnectionBanner } from "./connection-banner";
import { ViewBoundary } from "./view-boundary";
import { useTracking } from "./incendios/use-tracking";
import { IncendiosPanel } from "./incendios/incendios-panel";
import { IncendiosDock } from "./incendios/incendios-dock";
import { TrackingLayers } from "./incendios/tracking-layers";

export type { CloudSession };

// heavy views (recharts, long tables) are never on screen at first load: fetch them on demand
const MetricsView = dynamic(() => import("./metrics-view").then((m) => m.MetricsView), {
  loading: () => <ViewSkeleton />,
});
const ForecastView = dynamic(() => import("./forecast-view").then((m) => m.ForecastView), {
  loading: () => <ViewSkeleton />,
});
const IncidentsView = dynamic(() => import("./incidents-view").then((m) => m.IncidentsView), {
  loading: () => <ViewSkeleton />,
});

const MapView = dynamic(() => import("./map-view").then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center bg-[var(--surface-2)]">
      <div className="flex items-center gap-2 text-[12px] text-foreground/50">
        <span className="size-3 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />{" "}
        Cargando mapa
      </div>
    </div>
  ),
});

export function AdminApp({
  authRequired,
  cloud,
  initialTab,
}: {
  authRequired: boolean;
  cloud?: CloudSession;
  initialTab?: string;
}) {
  const a = useAdmin(authRequired, cloud, initialTab);
  const { ctx } = a;
  const fireTab = ctx.tab === "incendios";
  // loads the national feed only while the tab is open
  const tracking = useTracking(fireTab);
  const [cursor, setCursorPos] = useState<[number, number] | null>(null);

  const { setShortcutsOpen } = a;
  useShortcuts({
    goTab: a.goTab,
    toggleHelp: () => setShortcutsOpen(!a.shortcutsOpen),
  });
  const locale = a.s.locale;
  // the login and shared-link screens have no workspace yet: they read the last language from here
  useEffect(() => storeLocale(locale), [locale]);

  // theme on <html> so portaled menus and dialogs inherit it
  useEffect(() => {
    document.documentElement.classList.toggle("admin-dark", a.dark);
    return () => document.documentElement.classList.remove("admin-dark");
  }, [a.dark]);

  return (
    <div className="admin-root fixed inset-0 flex flex-col bg-background text-foreground">
      {/* client-only: Radix menu ids differ between server and client renders */}
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-foreground focus:px-3 focus:py-2 focus:text-[12px] focus:font-medium focus:text-background"
      >
        {ctx.t("top.skip")}
      </a>
      {a.mounted ? (
        <Topbar a={a} />
      ) : (
        <header className="h-11 shrink-0 border-b border-[var(--hairline)] bg-card" />
      )}
      {a.mounted && <StatusStrip ctx={ctx} />}
      {a.mounted && <BackupNotice ctx={ctx} />}
      {a.mounted && (
        <ConnectionBanner
          t={ctx.t}
          sync={a.sync}
          retrySync={a.retrySync}
          reload={ctx.reload}
          logout={a.logout}
        />
      )}
      <Toaster position="bottom-center" />
      {a.tour && <GuidedTour a={a} />}
      {a.mounted && (
        <ShortcutsHelp open={a.shortcutsOpen} setOpen={a.setShortcutsOpen} t={ctx.t} />
      )}
      {a.mounted && (
        <CommandPalette
          open={a.paletteOpen}
          setOpen={a.setPaletteOpen}
          actions={a.actions}
          ctx={ctx}
        />
      )}

      {a.isMapTab ? (
        <main
          id="admin-main"
          tabIndex={-1}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto outline-none lg:flex-row lg:overflow-hidden"
        >
          <div className="flex min-w-0 flex-1 flex-col lg:min-h-0">
            <div className="relative h-[58vh] min-h-[340px] shrink-0 lg:h-auto lg:min-h-0 lg:flex-1 lg:shrink">
              {a.ready && (
                <ViewBoundary name={ctx.t("view.map")} t={ctx.t} className="absolute inset-0">
                <MapView
                  ref={a.mapRef}
                  baseLayer={a.s.baseLayer}
                  region={a.region}
                  view={ctx.view}
                  exaggeration={a.s.exaggeration}
                  features={a.ws.features}
                  meta={a.ws.meta}
                  alertIds={a.alertIds}
                  fires={a.fires}
                  fireInfo={a.fireInfo}
                  early={a.earlyOnMap}
                  terrainAt={ctx.terrainAt}
                  dayLabels={a.dayLabels}
                  // the tracking tab draws its own fire layers: switch ours off so they do not overlap
                  show={fireTab ? { ...ctx.show, fires: false, heat: false, early: false, spread: false } : ctx.show}
                  spread={ctx.predH && !fireTab ? a.spread : null}
                  orbit={ctx.orbit && ctx.view === "3d"}
                  follow={a.followDrone}
                  zoneRisk={a.zoneRiskColors}
                  opacity={a.s.opacity}
                  wind={{
                    dir: ctx.weather?.windDir ?? 270,
                    speed: ctx.weather?.wind ?? 12,
                  }}
                  tool={ctx.tool}
                  selectedId={ctx.selectedId}
                  editing={ctx.editing}
                  drones={a.droneMarkers}
                  unitMarkers={
                    ctx.tab === "recursos" ? a.unitMarkers : undefined
                  }
                  units={a.s.units}
                  onSelect={ctx.select}
                  onCreate={(f) => {
                    a.addFeature(f);
                    a.setToolRaw(null);
                  }}
                  onEdited={a.onEdited}
                  onLive={a.setLive}
                  onCenter={a.setCenter}
                  onCursor={setCursorPos}
                  onCamera={a.setCamera}
                  incidentAt={a.incidentAt}
                  onOpenIncident={a.openIncidentAt}
                  onCreateZone={(f) => {
                    a.addFeature(f);
                    a.setToolRaw(null);
                  }}
                />
                </ViewBoundary>
              )}
              <MapOverlays a={a} cursor={cursor} />
              <TrackingLayers mapHandle={a.mapRef} t={tracking} active={fireTab && a.ready} />
              {ctx.tab === "drones" && <DronePip ctx={ctx} />}
            </div>
            <ViewBoundary name={ctx.t(`tab.${ctx.tab}`)} t={ctx.t} resetKey={ctx.tab}>
              {ctx.tab === "general" && <TimelineDock ctx={ctx} />}
              {fireTab && <IncendiosDock t={tracking} />}
              {ctx.tab === "drones" && <DroneDock ctx={ctx} />}
              {ctx.tab === "recursos" && <ResourcesDock ctx={ctx} />}
            </ViewBoundary>
          </div>
          <aside
            aria-label={ctx.t("app.sidePanel")}
            className={cn(
              "w-full shrink-0 overflow-y-auto border-t border-[var(--hairline)] bg-card lg:w-[336px] lg:border-l lg:border-t-0",
              !ctx.panelOpen && "lg:hidden",
            )}
          >
            <ViewBoundary name={ctx.t("view.panel")} t={ctx.t} resetKey={ctx.tab}>
              {ctx.tab === "general" && <GeneralPanel ctx={ctx} />}
              {fireTab && <IncendiosPanel t={tracking} />}
              {ctx.tab === "zonas" && <ZonesPanel ctx={ctx} />}
              {ctx.tab === "drones" && <DronesPanel ctx={ctx} />}
              {ctx.tab === "recursos" && <ResourcesPanel ctx={ctx} />}
            </ViewBoundary>
          </aside>
        </main>
      ) : (
        <main
          id="admin-main"
          tabIndex={-1}
          className="min-h-0 flex-1 overflow-y-auto bg-[var(--surface)] outline-none"
        >
          <ViewBoundary name={ctx.t(`tab.${ctx.tab}`)} t={ctx.t} resetKey={ctx.tab}>
            {ctx.tab === "pronostico" && <ForecastView ctx={ctx} />}
            {ctx.tab === "incidentes" && (
              <IncidentsView
                ctx={ctx}
                // bridge to the tracking tab: opens the same fire in its reconstruction
                onOpenMap={(i) => {
                  tracking.focus({ at: [i.lng, i.lat], ring: i.hulls[i.hulls.length - 1].ring });
                  ctx.goTab("incendios");
                }}
              />
            )}
            {ctx.tab === "metricas" && <MetricsView ctx={ctx} />}
            {ctx.tab === "config" && <SettingsView ctx={ctx} />}
          </ViewBoundary>
        </main>
      )}
    </div>
  );
}
