"use client";

import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  title,
  right,
  children,
  className,
}: {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl bg-foreground/[0.035] p-3.5",
        className,
      )}
    >
      {title && (
        <header className="mb-2.5 flex items-center justify-between gap-2">
          <h3 className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-foreground/45">
            {title}
          </h3>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "fire" | "ok";
}) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wider text-foreground/45">
        {label}
      </div>
      <div
        className={cn(
          "font-heading text-xl font-bold leading-tight tabular-nums",
          tone === "fire" && "text-[#b83a3a]",
          tone === "ok" && "text-primary",
        )}
      >
        {value}
      </div>
      {sub && <div className="text-[10.5px] text-foreground/45">{sub}</div>}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  swatch,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  swatch?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-[13px]">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="relative h-4 w-7 shrink-0 rounded-full bg-foreground/20 transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring after:absolute after:left-0.5 after:top-0.5 after:size-3 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-3" />
      {swatch && (
        <span className="size-2.5 rounded-sm" style={{ background: swatch }} />
      )}
      <span className={cn(!checked && "text-foreground/45")}>{label}</span>
    </label>
  );
}

type BtnProps = ComponentProps<"button"> & {
  variant?: "solid" | "ghost" | "danger" | "active";
};
export function Btn({ variant = "ghost", className, ...p }: BtnProps) {
  return (
    <button
      type="button"
      {...p}
      className={cn(
        "inline-flex min-h-8 items-center justify-center gap-1.5 rounded-md border px-2.5 text-[12px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-40",
        variant === "solid" &&
          "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "active" && "border-primary bg-primary/12 text-primary",
        variant === "ghost" &&
          "border-border bg-background/60 text-foreground/80 hover:bg-foreground/5",
        variant === "danger" &&
          "border-[#b83a3a]/40 bg-[#b83a3a]/8 text-[#b83a3a] hover:bg-[#b83a3a]/15",
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
        "inline-flex items-center rounded px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider",
        tone === "muted" && "bg-foreground/8 text-foreground/55",
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
  "h-9 w-full rounded-md border border-border bg-background px-2.5 text-[13px] outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring";
