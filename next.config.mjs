const isDev = process.env.NODE_ENV !== "production";

// Hosts the admin talks to from the browser. Keep in sync with docs/INTEGRACIONES.md.
const MAP_HOSTS = [
  "https://server.arcgisonline.com", // Esri imagery / topo
  "https://tiles.maps.eox.at", // Sentinel-2 cloudless
  "https://basemaps.cartocdn.com", // CARTO Voyager
  "https://gibs.earthdata.nasa.gov", // NASA GIBS true color
  "https://tiles.openfreemap.org", // vector tiles + glyphs
  "https://s3.amazonaws.com", // terrarium elevation tiles (AWS)
];
const API_HOSTS = [
  "https://api.open-meteo.com", // forecast
  "https://nominatim.openstreetmap.org", // place search
  "https://*.googleapis.com", // Firebase Auth / Firestore / installations
  "https://va.vercel-scripts.com", // Vercel Analytics beacon (dev loads its script from here)
  "https://power.larc.nasa.gov", // NASA POWER: weather of each tracked fire (Incendios tab)
];

// ponytail: 'unsafe-inline' scripts are needed by Next's inline bootstrap and the JSON-LD tags
// (no per-request nonce: it would force every page dynamic). 'unsafe-eval' and the Vercel debug
// script host only in dev (React/HMR); in production Analytics is served from /_vercel (self).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval' https://va.vercel-scripts.com" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https://res.cloudinary.com",
  "font-src 'self' data:",
  `connect-src 'self' blob: ${[...MAP_HOSTS, ...API_HOSTS].join(" ")}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ANALYZE_MAPS=1 npx next build: sourcemaps para que scripts/analyze-bundle.mjs atribuya bytes por paquete.
  productionBrowserSourceMaps: process.env.ANALYZE_MAPS === "1",
  // /api/admin/live reads data/static/** from disk (country outline, land cover): ship it with the function.
  outputFileTracingIncludes: { "/api/admin/live": ["./data/static/**/*"] },
  // ponytail: default is webp-only; avif is smaller for photos (hero bg,
  // press/blog art) and next/image already falls back to webp/original
  // per browser support, so this is a free size win with no risk.
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
