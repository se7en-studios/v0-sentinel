import type { ReactNode } from "react";

interface MapTooltipProps {
  /** point position as % of the map container, 0–100 */
  xPct: number;
  yPct: number;
  accentColor: string;
  children: ReactNode;
}

/**
 * Small info box anchored next to a map point. Flips to whichever side
 * keeps it inside the container instead of always opening the same way,
 * and carries a little tail pointing back at the dot.
 */
export function MapTooltip({
  xPct,
  yPct,
  accentColor,
  children,
}: MapTooltipProps) {
  const openLeft = xPct > 55;
  const openUp = yPct > 65;

  const border = `0.5px solid ${accentColor}40`;

  return (
    <div
      className="absolute z-10 rounded-lg px-4 py-3 text-[11px] leading-relaxed w-[188px] pointer-events-none animate-map-tooltip-in"
      style={{
        left: `${xPct}%`,
        top: `${yPct}%`,
        transform: `translate(${openLeft ? "calc(-100% - 12px)" : "12px"}, ${
          openUp ? "calc(-100% + 8px)" : "-8px"
        })`,
        fontFamily: "var(--font-sans)",
        background: "rgba(14,13,11,0.96)",
        border,
        color: "rgba(240,234,216,0.85)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 12px 28px rgba(0,0,0,0.45)",
      }}
    >
      {children}
      <span
        className="absolute w-2 h-2"
        style={{
          [openLeft ? "right" : "left"]: -4.5,
          [openUp ? "bottom" : "top"]: 12,
          background: "rgba(14,13,11,0.96)",
          borderRight: openLeft ? border : "none",
          borderTop: openLeft ? border : "none",
          borderLeft: !openLeft ? border : "none",
          borderBottom: !openLeft ? border : "none",
          transform: "rotate(45deg)",
        }}
      />
    </div>
  );
}

/**
 * Keyboard + screen-reader props for a clickable SVG map point (<g>).
 * Roving tabindex: only one point is a tab stop; arrows move between points.
 */
export function mapPointProps(
  label: string,
  onToggle: () => void,
  tabbable: boolean,
) {
  return {
    role: "button" as const,
    tabIndex: tabbable ? 0 : -1,
    "aria-label": label,
    className:
      "outline-none [&:focus-visible>circle:first-of-type]:stroke-[#0b6b44] [&:focus-visible>circle:first-of-type]:stroke-2",
    onKeyDown: (e: React.KeyboardEvent<SVGGElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
        return;
      }
      const step =
        e.key === "ArrowRight" || e.key === "ArrowDown"
          ? "nextElementSibling"
          : e.key === "ArrowLeft" || e.key === "ArrowUp"
            ? "previousElementSibling"
            : null;
      if (!step) return;
      let el = e.currentTarget[step];
      while (el && el.getAttribute("role") !== "button") el = el[step];
      if (el instanceof SVGGElement) {
        e.preventDefault();
        el.focus();
      }
    },
  };
}
