import type { ReactNode } from "react";

// Colors that meet WCAG AA on the #faf7f0 section background.
export const INK = "rgba(26,24,18,0.92)";
export const MUTED = "rgba(26,24,18,0.72)"; // ~6:1
export const FAINT = "rgba(26,24,18,0.66)"; // ~5:1, source notes
export const RED_TEXT = "#a32f2f";
export const GREEN_TEXT = "#0b6b44";

const TZ = "America/Argentina/Buenos_Aires";

/**
 * "26/10, 14:05 (hora Argentina)". Under ISR the page is cached, so a relative
 * "hace X min" computed on the server would be wrong; the absolute time of the
 * data is always true.
 */
export function formatUpdated(d: Date): string {
  return `${new Intl.DateTimeFormat("es-AR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d)} (hora Argentina)`;
}

export function Updated({ at }: { at: Date }) {
  return (
    <time dateTime={at.toISOString()}>Actualizado {formatUpdated(at)}</time>
  );
}

export function SectionShell({
  children,
  minHeight,
  max = "max-w-6xl",
  labelledBy,
}: {
  children: ReactNode;
  minHeight: number;
  max?: string;
  labelledBy: string;
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      className="relative py-20 lg:py-24 overflow-hidden"
      style={{ background: "#faf7f0", minHeight }}
    >
      <div className={`relative z-10 ${max} mx-auto px-6 lg:px-10`}>
        {children}
      </div>
    </section>
  );
}

/** Replaces `return null`: keeps the section (and its height) with a message. */
export function DataUnavailable({
  id,
  title,
  what,
  minHeight,
  max,
}: {
  id: string;
  title: string;
  what: string;
  minHeight: number;
  max?: string;
}) {
  return (
    <SectionShell labelledBy={id} minHeight={minHeight} max={max}>
      <h2
        id={id}
        className="text-3xl sm:text-4xl lg:text-5xl mb-4"
        style={{
          fontFamily: "var(--font-heading)",
          fontWeight: 800,
          color: INK,
          lineHeight: 1.1,
        }}
      >
        {title}
      </h2>
      <p
        role="status"
        className="text-sm max-w-xl"
        style={{ fontFamily: "var(--font-sans)", color: MUTED }}
      >
        {what} no está disponible en este momento (sin dato al{" "}
        {formatUpdated(new Date())}). Se reintenta automáticamente; volvé a
        visitar la página en unos minutos.
      </p>
    </SectionShell>
  );
}
