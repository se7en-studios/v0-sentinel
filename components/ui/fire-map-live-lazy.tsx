"use client";

// d3-geo + GeoJSON weigh too much for the initial bundle: the chunk is only
// requested once the chapter is about to enter the viewport.
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useCopy } from "@/lib/i18n/client";
import type { Copy } from "@/lib/i18n";

const FireMapLive = dynamic(
  () => import("@/components/ui/fire-map-live").then((m) => m.FireMapLive),
  { ssr: false, loading: () => <MapSkeleton /> },
);

const COPY: Copy<string> = { es: "Cargando mapa", en: "Loading map" };

function MapSkeleton() {
  const label = useCopy(COPY);
  return (
    <div
      role="status"
      aria-label={label}
      className="w-full aspect-[600/760] lg:aspect-auto lg:h-[min(84vh,840px)] bg-a-surface animate-pulse"
    />
  );
}

export function FireMapLiveLazy(
  props: React.ComponentProps<typeof FireMapLive>,
) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setNear(true);
        io.disconnect();
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref}>{near ? <FireMapLive {...props} /> : <MapSkeleton />}</div>
  );
}
