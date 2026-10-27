// ponytail: single SVG wordmark, brand green fill, replacing the old raster
// logoo.png (which was baked light-on-transparent for a dark theme and
// needed a dark backing plate wherever it sat on the light page).
export function SentinelLogo({
  className = "h-6 w-auto",
  fill = "#0f7a4f",
}: {
  className?: string;
  /** CSS colour of the wordmark; the admin passes the theme primary so it stays legible on the dark theme */
  fill?: string;
}) {
  return (
    <svg
      viewBox="0 0 140 24"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Sentinel"
    >
      <text
        x="0"
        y="18"
        fontFamily="var(--font-heading)"
        fontWeight={800}
        fontSize="17"
        letterSpacing="0.5"
        style={{ fill }}
      >
        SENTINEL
      </text>
    </svg>
  );
}

/** The brand symbol (the same one as the app icon): a deep-green disc with a pale vertical eye. */
export function SentinelMark({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="11.4" fill="#0f3d2c" stroke="#2fbf7a" strokeOpacity=".5" strokeWidth="1.2" />
      <ellipse cx="8.6" cy="12" rx="2.6" ry="6.4" fill="#faf7f0" />
    </svg>
  );
}

const EMBLEM_PATH =
  "M45 160 C112 146 171 113 211 44 C195 101 202 131 284 145 C220 151 167 185 126 270 C142 211 132 181 45 160 Z";

function EmblemShapes({ hole }: { hole: string }) {
  return (
    <>
      <path d={EMBLEM_PATH} />
      <ellipse cx="157" cy="158" rx="18" ry="34" transform="rotate(35 157 158)" fill={hole} />
      <ellipse cx="162" cy="149" rx="6" ry="12" transform="rotate(35 162 149)" />
    </>
  );
}

/** Logo oficial (emblema de cuatro puntas + wordmark), blanco sobre fondo oscuro. `hole` = color del fondo detrás del emblema. */
export function SentinelBrandLogo({ className = "h-7 w-auto", hole = "#0b1220" }: { className?: string; hole?: string }) {
  return (
    <svg viewBox="40 40 930 235" className={className} fill="#fff" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sentinel">
      <EmblemShapes hole={hole} />
      <text x="315" y="202" fontFamily="Arial, Helvetica, sans-serif" fontSize="112" fontWeight={400} letterSpacing="13">
        SENTINEL
      </text>
    </svg>
  );
}

/** Solo el emblema oficial. */
export function SentinelEmblem({ className = "size-11", hole = "#0b1220" }: { className?: string; hole?: string }) {
  return (
    <svg viewBox="40 40 250 235" className={className} fill="#fff" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <EmblemShapes hole={hole} />
    </svg>
  );
}
