"use client";

import { useEffect, useRef } from "react";

import {
  Box,
  Play,
  CalendarRange,
  ChevronDown,
  Command,
  FileText,
  Image as ImageIcon,
  Layers,
  Eye,
  EyeOff,
  Link2,
  LogOut,
  Map as MapIcon,
  MoreHorizontal,
  Moon,
  PanelRight,
  Redo2,
  RefreshCw,
  Rotate3d,
  Settings as Cog,
  Sun,
  Undo2,
  Download,
  Flame,
} from "lucide-react";
import { SentinelLogo } from "@/components/sentinel-logo";
import { cn } from "@/lib/utils";
import { REGIONS } from "@/lib/admin/types";
import { HORIZONS } from "@/lib/admin/spread";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { useAdmin } from "./use-admin";
import { TABS } from "./tabs";
import { IconBtn } from "./ui";

type A = ReturnType<typeof useAdmin>;

const trigger =
  "relative inline-flex h-8 items-center gap-1 rounded-lg px-2 before:absolute before:-inset-1 before:content-[''] text-[12px] font-medium text-foreground/70 transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-foreground/[0.06] data-[state=open]:text-foreground";

function fmtRange(days: string[]) {
  if (!days.length) return null;
  const f = (d: string) =>
    new Date(`${d}T12:00:00Z`).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  return `${f(days[0])} – ${f(days[days.length - 1])}`;
}

const SYNC_LABEL = {
  saved: "Guardado",
  saving: "Guardando…",
  loading: "Cargando…",
  local: "Local",
  error: "Sin conexión",
  conflict: "Conflicto",
} as const;

/** Always-visible save state for cloud accounts, with the recovery actions next to it. */
function SyncBadge({ a }: { a: A }) {
  const s = a.sync;
  const bad = s === "error" || s === "conflict";
  const action = "rounded px-1 font-semibold underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <div
      role="status"
      className="ml-1 hidden items-center gap-1.5 whitespace-nowrap text-[11px] text-foreground/60 md:flex"
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          bad ? "bg-[var(--state-bad)]" : s === "saved" ? "bg-primary" : "animate-pulse bg-[var(--state-warn)]",
        )}
        aria-hidden
      />
      {SYNC_LABEL[s]}
      {s === "error" && (
        <button type="button" onClick={a.retrySync} className={cn(action, "text-primary")}>
          Reintentar
        </button>
      )}
      {s === "conflict" && (
        <>
          <button type="button" onClick={() => a.resolveConflict("server")} className={cn(action, "text-primary")}>
            Usar la nube
          </button>
          <button type="button" onClick={() => a.resolveConflict("mine")} className={action}>
            Mantener lo mío
          </button>
        </>
      )}
    </div>
  );
}

export function Topbar({ a }: { a: A }) {
  const { ctx, s, region } = a;
  const nav = useRef<HTMLElement>(null);
  // on narrow screens the strip scrolls: keep the active mode visible
  useEffect(() => {
    nav.current
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [ctx.tab]);
  const airborne = ctx.drones.filter((d) => d.track).length;
  const badge = (id: string) =>
    id === "zonas"
      ? { n: ctx.alertCount, tone: "fire" as const }
      : id === "drones"
        ? { n: airborne, tone: "ok" as const }
        : null;
  const range = fmtRange(ctx.payload?.days ?? []);
  const email = a.cloud?.email;

  return (
    <header className="relative z-30 flex h-11 shrink-0 items-center gap-1 border-b border-[var(--hairline)] bg-card px-2 sm:px-3">
      <a
        href="/"
        aria-label="Volver al sitio de Sentinel"
        className="flex shrink-0 items-center gap-2 rounded-md px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <SentinelLogo className="h-[18px] w-auto" />
        <span className="hidden rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-primary lg:inline">
          Cloud
        </span>
      </a>
      <span className="mx-1.5 hidden h-5 w-px bg-[var(--hairline)] lg:block" />

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(trigger, "hidden text-foreground md:inline-flex")}
          aria-label="Cambiar región"
        >
          <span className="max-w-[200px] truncate font-semibold">
            {region.name.split("(")[0].trim()}
          </span>
          <ChevronDown className="size-3 opacity-50" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-64 rounded-xl border-[var(--hairline)] p-1.5 shadow-[var(--shadow-2)]"
        >
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-foreground/45">
            Región
          </DropdownMenuLabel>
          {REGIONS.map((r) => (
            <DropdownMenuItem
              key={r.id}
              onSelect={() => {
                a.goTab("general");
                a.setSettings({ regionId: r.id });
                a.mapRef.current?.flyTo(r.center, r.zoom);
              }}
              className={cn(
                "rounded-md text-[12.5px]",
                r.id === s.regionId && "bg-primary/10 font-medium text-primary",
              )}
            >
              {r.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <span className="hidden items-center gap-1.5 whitespace-nowrap px-2 text-[11.5px] text-foreground/50 xl:flex">
        Argentina
      </span>
      {range && (
        <span className="num hidden items-center gap-1.5 whitespace-nowrap rounded-lg border border-[var(--hairline)] px-2 py-1 text-[11px] text-foreground/60 2xl:flex">
          <CalendarRange className="size-3" aria-hidden /> {range}
        </span>
      )}

      <nav
        ref={nav}
        className="no-scrollbar mx-1 flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [&>*:first-child]:ml-auto [&>*:last-child]:mr-auto"
        aria-label="Modos"
      >
        {TABS.map((t) => {
          const b = badge(t.id);
          const on = a.tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => a.goTab(t.id)}
              aria-current={on ? "page" : undefined}
              className={cn(
                "relative flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                on
                  ? "bg-foreground text-background"
                  : "text-foreground/60 hover:bg-foreground/[0.06] hover:text-foreground",
              )}
            >
              <span className="hidden lg:inline">{ctx.t(`tab.${t.id}`)}</span>
              <span className="lg:hidden">{ctx.t(`tab.${t.id}.short`)}</span>
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
        })}
      </nav>

      <div className="hidden items-center md:flex">
        <DropdownMenu>
          <DropdownMenuTrigger className={trigger}>
            Vista <ChevronDown className="size-3 opacity-50" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-60 rounded-xl border-[var(--hairline)] p-1.5 shadow-[var(--shadow-2)]"
          >
            <DropdownMenuItem onSelect={() => a.setTour(true)}>
              <Play className="size-4" /> Recorrido guiado
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => ctx.setView("2d")}>
              <MapIcon className="size-4" /> Mapa 2D
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => ctx.setView("3d")}>
              <Box className="size-4" /> Mapa 3D con relieve
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                ctx.setView("3d");
                ctx.setOrbit(!ctx.orbit);
              }}
            >
              <Rotate3d className="size-4" />{" "}
              {ctx.orbit ? "Detener órbita" : "Órbita automática"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => ctx.setPanelOpen(!ctx.panelOpen)}>
              <PanelRight className="size-4" />{" "}
              {ctx.panelOpen
                ? "Ocultar panel lateral"
                : "Mostrar panel lateral"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={a.toggleTheme}>
              {a.dark ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}{" "}
              {a.dark ? "Modo claro" : "Modo oscuro"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className={trigger}>
            Análisis <ChevronDown className="size-3 opacity-50" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-60 rounded-xl border-[var(--hairline)] p-1.5 shadow-[var(--shadow-2)]"
          >
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-foreground/45">
              Propagación prevista
            </DropdownMenuLabel>
            {[0, ...HORIZONS].map((h) => (
              <DropdownMenuItem
                key={h}
                onSelect={() => {
                  a.goTab("general");
                  ctx.setPredH(h);
                }}
                className={cn(ctx.predH === h && "font-medium text-primary")}
              >
                <Flame className="size-4" />{" "}
                {h === 0 ? "Desactivada" : `Proyección a +${h} h`}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className={trigger}>
            Compartir <ChevronDown className="size-3 opacity-50" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-60 rounded-xl border-[var(--hairline)] p-1.5 shadow-[var(--shadow-2)]"
          >
            <DropdownMenuItem onSelect={ctx.shareView}>
              <Link2 className="size-4" /> Copiar enlace de esta vista
            </DropdownMenuItem>
            {a.canShare && (
              <>
                <DropdownMenuItem onSelect={a.shareReadOnly}>
                  <Eye className="size-4" /> Enlace de solo lectura (7 días)
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={a.revokeLinks}>
                  <EyeOff className="size-4" /> Revocar enlaces compartidos
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onSelect={ctx.exportPng}>
              <ImageIcon className="size-4" /> Exportar mapa como imagen
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={ctx.exportReport}>
              <FileText className="size-4" /> Reporte PDF
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={ctx.exportCsv}>
              <Download className="size-4" /> Focos en CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <span className="mx-1 hidden h-5 w-px bg-[var(--hairline)] md:block" />
      <div className="hidden items-center md:flex">
        <IconBtn
          aria-label={ctx.t("top.undo")}
          title={`${ctx.t("top.undo")} (Ctrl Z)`}
          disabled={!ctx.canUndo}
          onClick={() => ctx.undo()}
        >
          <Undo2 className="size-3.5" />
        </IconBtn>
        <IconBtn
          aria-label={ctx.t("top.redo")}
          title={`${ctx.t("top.redo")} (Ctrl Shift Z)`}
          disabled={!ctx.canRedo}
          onClick={() => ctx.redo()}
        >
          <Redo2 className="size-3.5" />
        </IconBtn>
      </div>
      <IconBtn
        aria-label={ctx.t("top.refresh")}
        title={ctx.t("top.refresh")}
        onClick={ctx.reload}
      >
        <RefreshCw className={cn("size-3.5", ctx.loading && "animate-spin")} />
      </IconBtn>
      {a.cloud && <SyncBadge a={a} />}
      <button
        type="button"
        onClick={() => a.setPaletteOpen(true)}
        aria-label="Abrir paleta de comandos"
        className="hidden h-8 items-center gap-1.5 rounded-lg border border-[var(--hairline)] bg-foreground/[0.03] pl-2 pr-1.5 text-[11.5px] text-foreground/50 transition-colors hover:bg-foreground/[0.06] lg:flex"
      >
        <Command className="size-3" aria-hidden /> Buscar
        <kbd className="mono rounded border border-[var(--hairline)] bg-card px-1 text-[9.5px]">
          Ctrl K
        </kbd>
      </button>

      {/* phones: everything the desktop menus offer, in one place */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="grid size-8 shrink-0 place-items-center rounded-lg text-foreground/70 hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-foreground/[0.06] md:hidden"
          aria-label={ctx.t("top.more")}
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="max-h-[75dvh] w-64 overflow-y-auto rounded-xl border-[var(--hairline)] p-1.5 shadow-[var(--shadow-2)]"
        >
          <DropdownMenuItem onSelect={() => a.setPaletteOpen(true)}>
            <Command className="size-4" /> Buscar y comandos
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!ctx.canUndo} onSelect={() => ctx.undo()}>
            <Undo2 className="size-4" /> Deshacer
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!ctx.canRedo} onSelect={() => ctx.redo()}>
            <Redo2 className="size-4" /> Rehacer
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-foreground/45">
            Región
          </DropdownMenuLabel>
          {REGIONS.map((r) => (
            <DropdownMenuItem
              key={r.id}
              onSelect={() => {
                a.goTab("general");
                a.setSettings({ regionId: r.id });
                a.mapRef.current?.flyTo(r.center, r.zoom);
              }}
              className={cn(r.id === s.regionId && "font-medium text-primary")}
            >
              <MapIcon className="size-4" /> {r.name.split("(")[0].trim()}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-foreground/45">
            Vista
          </DropdownMenuLabel>
          <DropdownMenuItem
            onSelect={() => ctx.setView(ctx.view === "3d" ? "2d" : "3d")}
          >
            <Box className="size-4" />{" "}
            {ctx.view === "3d" ? "Mapa 2D" : "Mapa 3D con relieve"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => a.setTour(true)}>
            <Play className="size-4" /> Recorrido guiado
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={a.toggleTheme}>
            {a.dark ? <Sun className="size-4" /> : <Moon className="size-4" />}{" "}
            {a.dark ? "Modo claro" : "Modo oscuro"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-foreground/45">
            Propagación prevista
          </DropdownMenuLabel>
          {[0, ...HORIZONS].map((h) => (
            <DropdownMenuItem
              key={h}
              onSelect={() => {
                a.goTab("general");
                ctx.setPredH(h);
              }}
              className={cn(ctx.predH === h && "font-medium text-primary")}
            >
              <Flame className="size-4" />{" "}
              {h === 0 ? "Desactivada" : `Proyección a +${h} h`}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-foreground/45">
            Compartir y exportar
          </DropdownMenuLabel>
          <DropdownMenuItem onSelect={ctx.shareView}>
            <Link2 className="size-4" /> Copiar enlace de esta vista
          </DropdownMenuItem>
          {a.canShare && (
            <DropdownMenuItem onSelect={a.shareReadOnly}>
              <Eye className="size-4" /> Enlace de solo lectura (7 días)
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={ctx.exportReport}>
            <FileText className="size-4" /> Reporte PDF
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={ctx.exportCsv}>
            <Download className="size-4" /> Focos en CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger
          className="ml-1 grid size-8 shrink-0 place-items-center rounded-full bg-primary/12 text-[12px] font-bold text-primary ring-offset-2 transition-shadow hover:ring-2 hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:ring-2 data-[state=open]:ring-primary/30"
          aria-label="Cuenta"
        >
          {(email ?? s.org ?? "S").slice(0, 1).toUpperCase()}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-64 rounded-xl border-[var(--hairline)] p-1.5 shadow-[var(--shadow-2)]"
        >
          <div className="px-2 py-1.5">
            <div className="truncate text-[12.5px] font-semibold">
              {s.org || "Sentinel"}
            </div>
            <div className="truncate text-[11px] text-foreground/50">
              {email ?? "Modo demo local"}
            </div>
            {a.cloud && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[10.5px] text-foreground/55">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    a.sync === "error" || a.sync === "conflict"
                      ? "bg-[#b83a3a]"
                      : a.sync === "saved"
                        ? "bg-primary"
                        : "animate-pulse bg-[#c9a300]",
                  )}
                />
                {a.sync === "saved"
                  ? "Guardado en la nube"
                  : a.sync === "error"
                    ? "Sin conexión: guardado local"
                    : a.sync === "conflict"
                      ? "Cambios en conflicto"
                      : "Sincronizando…"}
                {a.sync === "conflict" && (
                  <>
                    <button
                      type="button"
                      onClick={() => a.resolveConflict("server")}
                      className="ml-1 rounded px-1 font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Usar la nube
                    </button>
                    <button
                      type="button"
                      onClick={() => a.resolveConflict("mine")}
                      className="rounded px-1 font-semibold underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Mantener lo mío
                    </button>
                  </>
                )}
                {a.sync === "error" && (
                  <button
                    type="button"
                    onClick={a.retrySync}
                    className="ml-1 rounded px-1 font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Reintentar
                  </button>
                )}
              </div>
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={a.toggleTheme}>
            {a.dark ? <Sun className="size-4" /> : <Moon className="size-4" />}{" "}
            {a.dark ? "Modo claro" : "Modo oscuro"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => a.goTab("config")}>
            <Cog className="size-4" /> Configuración
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => a.setPaletteOpen(true)}>
            <Layers className="size-4" /> Atajos y comandos
          </DropdownMenuItem>
          {a.authRequired && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={a.logout}
                className="text-[#b83a3a] focus:text-[#b83a3a]"
              >
                <LogOut className="size-4" /> Cerrar sesión
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
