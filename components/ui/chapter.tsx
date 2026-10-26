import type { ReactNode } from "react";

type Tone = "light" | "dark";

// Contenedor común de cada capítulo: ritmo vertical, ancho y tono (claro/oscuro) unificados.
export function Chapter({
  id,
  tone = "light",
  className = "",
  children,
}: {
  id?: string;
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  const palette =
    tone === "dark"
      ? "bg-charcoal text-[#f4efe2]"
      : "bg-background text-foreground";
  return (
    <section id={id} className={`relative scroll-mt-20 py-24 md:py-36 ${palette} ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-5 md:px-8">{children}</div>
    </section>
  );
}

export function Eyebrow({ children, tone = "light" }: { children: ReactNode; tone?: Tone }) {
  return (
    <p className={`t-label mb-5 ${tone === "dark" ? "text-leaf-bright" : "text-[#0b6b44]"}`}>
      {children}
    </p>
  );
}

export function Stat({
  value,
  label,
  source,
  tone = "light",
}: {
  value: string;
  label: string;
  source?: string;
  tone?: Tone;
}) {
  return (
    <div>
      <div className={`t-h2 ${tone === "dark" ? "text-leaf-bright" : "text-leaf"}`}>{value}</div>
      <div className="t-small mt-2 opacity-80">{label}</div>
      {source ? <div className="t-small mt-1 opacity-60">{source}</div> : null}
    </div>
  );
}
