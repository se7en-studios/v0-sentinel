import type { MetadataRoute } from "next";

// Installable admin panel. No service worker on purpose: wildfire data must never be served stale from a cache.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/admin",
    name: "Sentinel · Panel de incendios",
    short_name: "Sentinel",
    description: "Monitoreo satelital de incendios forestales en Argentina.",
    lang: "es-AR",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    orientation: "any",
    background_color: "#0c232d",
    theme_color: "#123a28",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
