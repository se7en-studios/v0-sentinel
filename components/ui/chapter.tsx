import type { ReactNode } from "react";

type Tone = "light" | "dark";

// Contenedor común de cada capítulo: ritmo vertical y ancho unificados.
// light = papel, dark = tinta (usar con mesura: máximo un par de bloques oscuros en la página).
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
  const palette = tone === "dark" ? "bg-ink text-paper" : "bg-paper text-ink";
  return (
    <section
      id={id}
      className={`relative scroll-mt-20 py-20 md:py-32 ${palette} ${className}`}
    >
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8">{children}</div>
    </section>
  );
}

export function Eyebrow({
  children,
  tone = "light",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <p
      className={`t-label mb-4 ${tone === "dark" ? "text-paper/70" : "text-ink/70"}`}
    >
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
      <div className={`t-h2 ${tone === "dark" ? "text-paper" : "text-ink"}`}>
        {value}
      </div>
      <div className="t-body mt-2 opacity-80">{label}</div>
      {source ? <div className="t-caption mt-1">{source}</div> : null}
    </div>
  );
}
