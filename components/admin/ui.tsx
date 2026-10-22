"use client";

import type { ComponentProps, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Translate } from "@/lib/admin/i18n";

/** Section header used across panels: micro label + optional action. */
export function SectionTitle({
  children,
  right,
}: {
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="mb-2.5 flex items-center justify-between gap-2">
      <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-foreground/50">
        {children}
      </h3>
      {right}
    </header>
  );
}

/**
 * Panel section. `bare` renders a flat, hairline-separated block (sidebar);
 * the default is a soft boxed card (metrics, settings).
 */
export function Card({
  title,
  right,
  children,
  className,
  bare,
  id,
}: {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bare?: boolean;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        bare
          ? "border-b border-[var(--hairline)] px-4 py-3.5 last:border-b-0"
          : "rounded-xl border border-[var(--hairline)] bg-card p-4 shadow-[var(--shadow-1)]",
        className,
      )}
    >
      {title && <SectionTitle right={right}>{title}</SectionTitle>}
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "fire" | "ok" | "warn";
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="truncate text-[10px] font-medium uppercase tracking-[0.08em] text-foreground/45">
        {label}
      </div>
      <div
        className={cn(
          "num mt-0.5 truncate font-heading text-[19px] font-bold leading-tight tracking-tight",
          tone === "fire" && "text-[#c8321e]",
          tone === "ok" && "text-primary",
          tone === "warn" && "text-[#b9560a]",
        )}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-px truncate text-[10.5px] text-foreground/45">
          {sub}
        </div>
      )}
    </div>
  );
}

/** Key / value row, like the reference incident overview table. */
export function KV({
  k,
  children,
  mono,
}: {
  k: string;
  children: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-[3px] text-[11.5px]">
      <dt className="shrink-0 text-foreground/50">{k}</dt>
      <dd
        className={cn(
          "min-w-0 truncate text-right font-medium text-foreground/90",
          mono && "mono",
        )}
      >
        {children}
      </dd>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  swatch,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  swatch?: string;
  hint?: string;
}) {
  return (
    <label className="group flex cursor-pointer items-start gap-2.5 py-1.5 text-[12.5px]">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="relative mt-px h-[18px] w-8 shrink-0 rounded-full bg-foreground/50 transition-colors duration-150 peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring after:absolute after:left-[2px] after:top-[2px] after:size-[14px] after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:duration-150 peer-checked:after:translate-x-[14px]" />
      {swatch && (
        <span
          className="mt-[5px] size-2.5 shrink-0 rounded-[3px]"
          style={{ background: swatch }}
        />
      )}
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block break-words transition-colors",
            !checked && "text-foreground/45",
          )}
        >
          {label}
        </span>
        {hint && (
          <span className="mt-0.5 block text-[11px] leading-snug text-foreground/55">{hint}</span>
        )}
      </span>
    </label>
  );
}

type BtnProps = ComponentProps<"button"> & {
  variant?: "solid" | "ghost" | "danger" | "active" | "fire";
};
export function Btn({ variant = "ghost", className, ...p }: BtnProps) {
  return (
    <button
      type="button"
      {...p}
      className={cn(
        "inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-medium transition-[background-color,border-color,color,transform,box-shadow] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        variant === "solid" &&
          "border-primary bg-primary text-primary-foreground shadow-sm hover:brightness-110",
        variant === "fire" &&
          "border-[var(--fire)] bg-[var(--fire)] text-white shadow-sm hover:brightness-110",
        variant === "active" && "border-primary/50 bg-primary/10 text-primary",
        variant === "ghost" &&
          "border-[var(--hairline)] bg-card text-foreground/80 hover:bg-foreground/[0.04]",
        variant === "danger" &&
          "border-[var(--state-bad-ink)]/30 bg-[var(--state-bad-ink)]/[0.06] text-[var(--state-bad-ink)] hover:bg-[var(--state-bad-ink)]/12",
        className,
      )}
    />
  );
}

/** Square icon-only button with a 40px hit area on touch. */
export function IconBtn({
  className,
  active,
  ...p
}: ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      {...p}
      className={cn(
        "relative grid size-8 shrink-0 place-items-center rounded-lg text-foreground/65 transition-[background-color,color,transform] duration-150 before:absolute before:-inset-1 before:content-[''] hover:bg-foreground/[0.06] hover:text-foreground active:scale-95 disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active && "bg-primary/12 text-primary",
        className,
      )}
    />
  );
}

export function Badge({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "fire" | "ok" | "sim";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-[2px] text-[9.5px] font-semibold uppercase tracking-[0.08em]",
        tone === "muted" && "bg-foreground/[0.07] text-foreground/55",
        tone === "fire" && "bg-[#b83a3a]/12 text-[#b83a3a]",
        tone === "ok" && "bg-primary/12 text-primary",
        tone === "sim" && "bg-[#e8710a]/14 text-[#b9560a]",
      )}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11.5px] font-medium text-foreground/70">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-[10.5px] text-foreground/45">
          {hint}
        </span>
      )}
    </label>
  );
}

export const inputCls =
  "h-9 w-full rounded-lg border border-[var(--hairline)] bg-card px-2.5 text-[13px] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-foreground/35 focus:border-primary focus:ring-2 focus:ring-ring";

/** Segmented control (single choice). */
export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
  label: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "grid auto-cols-fr grid-flow-col gap-0.5 rounded-lg bg-foreground/[0.06] p-0.5",
        className,
      )}
    >
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "min-h-7 rounded-md px-2 text-[11.5px] font-medium transition-[background-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === o.value
              ? "bg-card text-foreground shadow-[var(--shadow-1)]"
              : "text-foreground/55 hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Slim range slider with a numeric readout. */
export function Slider({
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  label,
  format,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  format?: (v: number) => string;
  className?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-4 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-card [&::-moz-range-thumb]:bg-primary [&::-moz-range-track]:h-[3px] [&::-moz-range-track]:rounded-full [&::-webkit-slider-runnable-track]:h-[3px] [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:-mt-[4.5px] [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-card [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-125"
        style={{
          background: `linear-gradient(to right, var(--primary) ${pct}%, color-mix(in srgb, var(--foreground) 14%, transparent) ${pct}%) center / 100% 3px no-repeat`,
        }}
      />
      <span className="num w-9 shrink-0 text-right text-[10.5px] text-foreground/50">
        {format ? format(value) : `${Math.round(value * 100)}%`}
      </span>
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="mono rounded-[5px] border border-[var(--hairline)] bg-foreground/[0.04] px-1.5 py-px text-[10px] font-medium text-foreground/55">
      {children}
    </kbd>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-foreground/[0.07]", className)}
    />
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center gap-2 rounded-xl border border-dashed border-[var(--hairline)] px-4 py-7 text-center">
      <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="text-[13px] font-semibold">{title}</div>
      {children && (
        <p className="max-w-[26ch] text-[11.5px] leading-snug text-foreground/50">
          {children}
        </p>
      )}
      {action}
    </div>
  );
}

/** Tiny inline trend line. */
export function Sparkline({
  values,
  className,
  stroke = "currentColor",
}: {
  values: number[];
  className?: string;
  stroke?: string;
}) {
  if (values.length < 2) return null;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pts = values
    .map(
      (v, i) =>
        `${(i / (values.length - 1)) * 100},${18 - ((v - lo) / (hi - lo || 1)) * 16}`,
    )
    .join(" ");
  return (
    <svg
      viewBox="0 0 100 20"
      preserveAspectRatio="none"
      className={cn("h-5 w-14", className)}
      aria-hidden
    >
      <polyline
        points={pts}
        fill="none"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * A chart announced as one image with a text summary, plus the same data as a
 * visually hidden table (a sibling, because role="img" hides its children).
 */
export function ChartFrame({
  label,
  caption,
  columns,
  rows,
  className,
  children,
}: {
  label: string;
  caption: string;
  columns: string[];
  rows: (string | number)[][];
  className?: string;
  children: ReactNode;
}) {
  return (
    <>
      <div role="img" aria-label={label} className={className}>
        {children}
      </div>
      <table className="sr-only">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((v, j) =>
                j === 0 ? (
                  <th key={j} scope="row">
                    {v}
                  </th>
                ) : (
                  <td key={j}>{v}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/** Placeholder with the rough shape of a data view while the feed loads. */
export function ViewSkeleton({ t }: { t?: Translate } = {}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6"
    >
      <span className="sr-only">{t ? t("ui.loadingData") : "Cargando datos…"}</span>
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-60" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-52" />
        <Skeleton className="h-52" />
      </div>
    </div>
  );
}

/** Failure state with a way out. */
export function ErrorState({
  message,
  onRetry,
  loading,
  compact,
  t,
}: {
  message: string;
  onRetry: () => void;
  loading?: boolean;
  compact?: boolean;
  t?: Translate;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-wrap items-center justify-center gap-3 rounded-xl border border-[var(--state-bad)]/30 bg-[var(--state-bad)]/[0.06] text-center",
        compact ? "justify-between px-3 py-2 text-left" : "mx-auto my-10 max-w-md flex-col px-6 py-8",
      )}
    >
      <div className={cn("flex items-center gap-2", !compact && "flex-col")}>
        <AlertTriangle className="size-5 text-[var(--state-bad-ink)]" aria-hidden />
        <div>
          <div className="text-[13px] font-semibold">{t ? t("ui.loadFail") : "No pudimos cargar los datos"}</div>
          <p className="text-[12px] text-foreground/60">{message}</p>
        </div>
      </div>
      <Btn onClick={onRetry} disabled={loading}>
        <RefreshCw className={cn("size-3.5", loading && "animate-spin")} aria-hidden />
        {t ? t("ui.retry") : "Reintentar"}
      </Btn>
    </div>
  );
}

/** Skeleton while loading, error with retry on failure, never a blank panel. */
export function DataGate({
  payload,
  loading,
  error,
  reload,
  children,
  t,
}: {
  payload: unknown;
  loading: boolean;
  error: string | null;
  reload: () => void;
  children: ReactNode;
  t?: Translate;
}) {
  if (!payload) {
    if (error) return <ErrorState message={error} onRetry={reload} loading={loading} t={t} />;
    if (loading) return <ViewSkeleton t={t} />;
    return (
      <ErrorState
        message={t ? t("ui.noFires") : "Todavía no hay datos de focos para mostrar."}
        onRetry={reload}
        t={t}
      />
    );
  }
  return (
    <>
      {error && (
        <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
          <ErrorState compact message={t ? t("ui.showingLast", { error }) : `${error} Mostramos los últimos datos recibidos.`} onRetry={reload} loading={loading} t={t} />
        </div>
      )}
      {children}
    </>
  );
}
