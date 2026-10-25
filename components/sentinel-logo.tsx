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
