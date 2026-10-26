"use client";

import dynamic from "next/dynamic";

// ponytail: client-only on purpose. The scene's SVG paths are large and carry no indexable content, so they
// stay out of the HTML; the placeholder keeps the section's height so nothing below jumps when it loads.
export const ForestJourney = dynamic(
  () => import("./forest-journey").then((m) => m.ForestJourney),
  { ssr: false, loading: () => <div aria-hidden className="h-[480svh] bg-charcoal max-md:h-[78svh] motion-reduce:h-[78svh]" /> },
);
