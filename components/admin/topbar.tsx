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
  Keyboard,
} from "lucide-react";
import { SentinelLogo, SentinelMark } from "@/components/sentinel-logo";
import { cn } from "@/lib/utils";
import { NUM_LOCALE } from "@/lib/admin/i18n-shell";
import type { Locale } from "@/lib/admin/i18n";
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
  "relative inline-flex h-8 max-md:h-11 items-center gap-1 rounded-lg px-2 before:absolute before:-inset-1 before:content-[''] text-[12px] font-medium text-foreground/70 transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-foreground/[0.06] data-[state=open]:text-foreground";

function fmtRange(days: string[], loc: Locale) {
  if (!days.length) return null;
  const f = (d: string) =>
    new Date(`${d}T12:00:00Z`).toLocaleDateString(NUM_LOCALE[loc], {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  return `${f(days[0])} – ${f(days[days.length - 1])}`;
}

/** Always-visible save state for cloud accounts, with the recovery actions next to it. */
function SyncBadge({ a }: { a: A }) {
  const s = a.sync;
  const t = a.ctx.t;
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
      {t(`sync.${s}`)}
      {s === "error" && (
        <button type="button" onClick={a.retrySync} className={cn(action, "text-primary")}>
          {t("sync.retry")}
        </button>
      )}
      {s === "conflict" && (
        <>
          <button type="button" onClick={() => a.resolveConflict("server")} className={cn(action, "text-primary")}>
            {t("sync.useCloud")}
          </button>
          <button type="button" onClick={() => a.resolveConflict("mine")} className={action}>
            {t("sync.keepMine")}
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
  const t = ctx.t;
  const range = fmtRange(ctx.payload?.days ?? [], ctx.ws.settings.locale);
  const email = a.cloud?.email;

  return (
    <header className="relative z-30 flex min-h-11 shrink-0 items-center gap-1 max-md:flex-wrap border-b border-[var(--hairline)] bg-card px-2 sm:px-3">
      <a
        href="/"
        aria-label={t("top.back")}
        className="flex shrink-0 items-center gap-2 rounded-md px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <SentinelMark className="size-[22px] shrink-0" />
        <SentinelLogo className="h-[18px] w-auto" fill="var(--primary)" />
        <span className="hidden rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-primary 2xl:inline">
          Cloud
        </span>
      </a>
      <span className="mx-1.5 hidden h-5 w-px bg-[var(--hairline)] lg:block" />

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(trigger, "hidden text-foreground md:inline-flex")}
          aria-label={t("top.changeRegion")}
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
            {t("top.region")}
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
      <span className="hidden items-center gap-1.5 whitespace-nowrap px-2 text-[11.5px] text-foreground/50 2xl:flex">
        Argentina
      </span>
      {range && (
        <span className="num hidden items-center gap-1.5 whitespace-nowrap rounded-lg border border-[var(--hairline)] px-2 py-1 text-[11px] text-foreground/60 2xl:flex">
          <CalendarRange className="size-3" aria-hidden /> {range}
        </span>
      )}

      {/* phone: the tabs get their own full-width row under the logo and icons instead of ~110 px between them */}
      <span className="flex-1 md:hidden" aria-hidden />
      <nav
        ref={nav}
        className="no-scrollbar mx-1 flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto max-md:order-last max-md:mx-0 max-md:basis-full max-md:flex-none max-md:snap-x max-md:border-t max-md:border-[var(--hairline)] max-md:py-1 [&>*:first-child]:ml-auto [&>*:last-child]:mr-auto max-md:[&>*:first-child]:ml-0 max-md:[&>*:last-child]:mr-0"
        aria-label={t("top.modes")}
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
                "relative flex h-8 max-lg:h-11 max-md:h-9 max-md:snap-center shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                on
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/60 hover:bg-foreground/[0.06] hover:text-foreground",
              )}
            >
              <span className="hidden lg:inline">{ctx.t(`tab.${t.id}`)}</span>
              <span className="lg:hidden">{ctx.t(`tab.${t.id}.short`)}</span>
              {b && b.n > 0 && (
                <span
                  className={cn(
                    "num grid min-w-4 place-items-center rounded-full px-1 text-[9.5px] font-bold leading-4",
                    b.tone === "fire" ? "bg-[#c8321e] text-white" : "bg-primary text-primary-foreground",
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
          <DropdownMenuTrigger className={trigger} aria-label={t("top.view")}>
            <Layers className="size-4 2xl:hidden" aria-hidden />
            <span className="hidden 2xl:inline">{t("top.view")}</span>
            <ChevronDown className="size-3 opacity-50" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-60 rounded-xl border-[var(--hairline)] p-1.5 shadow-[var(--shadow-2)]"
          >
            <DropdownMenuItem onSelect={() => a.setTour(true)}>
              <Play className="size-4" /> {t("top.tour")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => ctx.setView("2d")}>
              <MapIcon className="size-4" /> {t("top.map2d")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => ctx.setView("3d")}>
              <Box className="size-4" /> {t("top.map3d")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                ctx.setView("3d");
                ctx.setOrbit(!ctx.orbit);
              }}
            >
              <Rotate3d className="size-4" />{" "}
              {ctx.orbit ? t("top.orbitStop") : t("top.orbitStart")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => ctx.setPanelOpen(!ctx.panelOpen)}>
              <PanelRight className="size-4" />{" "}
              {ctx.panelOpen ? t("top.panelHide") : t("top.panelShow")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={a.toggleTheme}>
              {a.dark ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}{" "}
              {a.dark ? t("top.themeLight") : t("top.themeDark")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className={trigger} aria-label={t("top.analysis")}>
            <Flame className="size-4 2xl:hidden" aria-hidden />
            <span className="hidden 2xl:inline">{t("top.analysis")}</span>
            <ChevronDown className="size-3 opacity-50" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-60 rounded-xl border-[var(--hairline)] p-1.5 shadow-[var(--shadow-2)]"
          >
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-foreground/45">
              {t("top.spread")}
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
                {h === 0 ? t("top.spreadOff") : t("top.spreadTo", { h })}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className={trigger} aria-label={t("top.share")}>
            <Link2 className="size-4 2xl:hidden" aria-hidden />
            <span className="hidden 2xl:inline">{t("top.share")}</span>
            <ChevronDown className="size-3 opacity-50" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-60 rounded-xl border-[var(--hairline)] p-1.5 shadow-[var(--shadow-2)]"
          >
            <DropdownMenuItem onSelect={ctx.shareView}>
              <Link2 className="size-4" /> {t("top.copyLink")}
            </DropdownMenuItem>
            {a.canShare && (
              <>
                <DropdownMenuItem onSelect={a.shareReadOnly}>
                  <Eye className="size-4" /> {t("top.shareRO")}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={a.revokeLinks}>
                  <EyeOff className="size-4" /> {t("top.revoke")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onSelect={ctx.exportPng}>
              <ImageIcon className="size-4" /> {t("top.exportPng")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={ctx.exportReport}>
              <FileText className="size-4" /> {t("top.pdf")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={ctx.exportCsv}>
              <Download className="size-4" /> {t("top.csv")}
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
        aria-label={t("top.openPalette")}
        className="hidden h-8 items-center gap-1.5 rounded-lg border border-[var(--hairline)] bg-foreground/[0.03] px-2 text-[11.5px] text-foreground/50 transition-colors hover:bg-foreground/[0.06] lg:flex 2xl:pl-2 2xl:pr-1.5"
      >
        <Command className="size-3" aria-hidden />
        <span className="hidden 2xl:inline">{t("top.search")}</span>
        <kbd className="mono hidden rounded border border-[var(--hairline)] bg-card px-1 text-[9.5px] 2xl:inline">
          Ctrl K
        </kbd>
      </button>

      {/* phones: everything the desktop menus offer, in one place */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="grid size-8 max-md:size-11 shrink-0 place-items-center rounded-lg text-foreground/70 hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-foreground/[0.06] md:hidden"
          aria-label={ctx.t("top.more")}
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="max-h-[75dvh] w-64 overflow-y-auto rounded-xl border-[var(--hairline)] p-1.5 shadow-[var(--shadow-2)]"
        >
          <DropdownMenuItem onSelect={() => a.setPaletteOpen(true)}>
            <Command className="size-4" /> {t("top.searchCmd")}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!ctx.canUndo} onSelect={() => ctx.undo()}>
            <Undo2 className="size-4" /> {t("top.undo")}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!ctx.canRedo} onSelect={() => ctx.redo()}>
            <Redo2 className="size-4" /> {t("top.redo")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-foreground/45">
            {t("top.region")}
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
            {t("top.view")}
          </DropdownMenuLabel>
          <DropdownMenuItem
            onSelect={() => ctx.setView(ctx.view === "3d" ? "2d" : "3d")}
          >
            <Box className="size-4" />{" "}
            {ctx.view === "3d" ? t("top.map2d") : t("top.map3d")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => a.setTour(true)}>
            <Play className="size-4" /> {t("top.tour")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={a.toggleTheme}>
            {a.dark ? <Sun className="size-4" /> : <Moon className="size-4" />}{" "}
            {a.dark ? t("top.themeLight") : t("top.themeDark")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-foreground/45">
            {t("top.spread")}
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
              {h === 0 ? t("top.spreadOff") : t("top.spreadTo", { h })}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-foreground/45">
            {t("top.shareExport")}
          </DropdownMenuLabel>
          <DropdownMenuItem onSelect={ctx.shareView}>
            <Link2 className="size-4" /> {t("top.copyLink")}
          </DropdownMenuItem>
          {a.canShare && (
            <DropdownMenuItem onSelect={a.shareReadOnly}>
              <Eye className="size-4" /> {t("top.shareRO")}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={ctx.exportReport}>
            <FileText className="size-4" /> {t("top.pdf")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={ctx.exportCsv}>
            <Download className="size-4" /> {t("top.csv")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger
          className="ml-1 grid size-8 max-md:size-11 shrink-0 place-items-center rounded-full bg-primary/12 text-[12px] font-bold text-primary ring-offset-2 transition-shadow hover:ring-2 hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:ring-2 data-[state=open]:ring-primary/30"
          aria-label={t("top.account")}
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
              {email ?? t("top.demoLocal")}
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
                  ? t("sync.savedCloud")
                  : a.sync === "error"
                    ? t("sync.errorLocal")
                    : a.sync === "conflict"
                      ? t("sync.conflictLong")
                      : t("sync.syncing")}
                {a.sync === "conflict" && (
                  <>
                    <button
                      type="button"
                      onClick={() => a.resolveConflict("server")}
                      className="ml-1 rounded px-1 font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {t("sync.useCloud")}
                    </button>
                    <button
                      type="button"
                      onClick={() => a.resolveConflict("mine")}
                      className="rounded px-1 font-semibold underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {t("sync.keepMine")}
                    </button>
                  </>
                )}
                {a.sync === "error" && (
                  <button
                    type="button"
                    onClick={a.retrySync}
                    className="ml-1 rounded px-1 font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {t("sync.retry")}
                  </button>
                )}
              </div>
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={a.toggleTheme}>
            {a.dark ? <Sun className="size-4" /> : <Moon className="size-4" />}{" "}
            {a.dark ? t("top.themeLight") : t("top.themeDark")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => a.goTab("config")}>
            <Cog className="size-4" /> {t("top.settings")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => a.setPaletteOpen(true)}>
            <Layers className="size-4" /> {t("top.shortcutsCmds")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => a.setShortcutsOpen(true)}>
            <Keyboard className="size-4" /> {t("top.shortcutsHelp")}
          </DropdownMenuItem>
          {a.authRequired && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={a.logout}
                className="text-[#b83a3a] focus:text-[#b83a3a]"
              >
                <LogOut className="size-4" /> {t("top.logout")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
