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
import { MetricsView } from "./metrics-view";
import { ForecastView } from "./forecast-view";
import { IncidentsView } from "./incidents-view";
import { SettingsView } from "./settings-view";
import { GuidedTour } from "./tour";
import { StatusStrip } from "./status-strip";

export type { CloudSession };

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
}: {
  authRequired: boolean;
  cloud?: CloudSession;
}) {
  const a = useAdmin(authRequired, cloud);
  const { ctx } = a;
  const [cursor, setCursorPos] = useState<[number, number] | null>(null);

  // theme on <html> so portaled menus and dialogs inherit it
  useEffect(() => {
    document.documentElement.classList.toggle("admin-dark", a.dark);
    return () => document.documentElement.classList.remove("admin-dark");
  }, [a.dark]);

  return (
    <div className="admin-root fixed inset-0 flex flex-col bg-background text-foreground">
      {/* client-only: Radix menu ids differ between server and client renders */}
      {a.mounted ? (
        <Topbar a={a} />
      ) : (
        <header className="h-11 shrink-0 border-b border-[var(--hairline)] bg-card" />
      )}
      {a.mounted && <StatusStrip ctx={ctx} />}
      <Toaster position="bottom-center" />
      {a.tour && <GuidedTour a={a} />}
      {a.mounted && (
        <CommandPalette
          open={a.paletteOpen}
          setOpen={a.setPaletteOpen}
          actions={a.actions}
          ctx={ctx}
        />
      )}

      {a.isMapTab ? (
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
          <div className="flex min-w-0 flex-1 flex-col lg:min-h-0">
            <div className="relative h-[58vh] min-h-[340px] shrink-0 lg:h-auto lg:min-h-0 lg:flex-1 lg:shrink">
              {a.ready && (
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
                  dayLabels={a.dayLabels}
                  show={ctx.show}
                  spread={ctx.predH ? a.spread : null}
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
                />
              )}
              <MapOverlays a={a} cursor={cursor} />
              {ctx.tab === "drones" && <DronePip ctx={ctx} />}
            </div>
            {ctx.tab === "general" && <TimelineDock ctx={ctx} />}
            {ctx.tab === "drones" && <DroneDock ctx={ctx} />}
            {ctx.tab === "recursos" && <ResourcesDock ctx={ctx} />}
          </div>
          <aside
            aria-label="Panel lateral"
            className={cn(
              "w-full shrink-0 overflow-y-auto border-t border-[var(--hairline)] bg-card lg:w-[336px] lg:border-l lg:border-t-0",
              !ctx.panelOpen && "lg:hidden",
            )}
          >
            {ctx.tab === "general" && <GeneralPanel ctx={ctx} />}
            {ctx.tab === "zonas" && <ZonesPanel ctx={ctx} />}
            {ctx.tab === "drones" && <DronesPanel ctx={ctx} />}
            {ctx.tab === "recursos" && <ResourcesPanel ctx={ctx} />}
          </aside>
        </main>
      ) : (
        <main className="min-h-0 flex-1 overflow-y-auto bg-[var(--surface)]">
          {ctx.tab === "pronostico" && <ForecastView ctx={ctx} />}
          {ctx.tab === "incidentes" && <IncidentsView ctx={ctx} />}
          {ctx.tab === "metricas" && <MetricsView ctx={ctx} />}
          {ctx.tab === "config" && <SettingsView ctx={ctx} />}
        </main>
      )}
    </div>
  );
}
