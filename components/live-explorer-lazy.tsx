"use client";

// The combobox + map card is only fetched when the chapter is near the
// viewport; the skeleton reserves the same space so nothing jumps.
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useCopy } from "@/lib/i18n/client";
import type { Copy } from "@/lib/i18n";

const LiveExplorer = dynamic(
  () => import("@/components/locality-check").then((m) => m.LiveExplorer),
  { ssr: false, loading: () => <ExplorerSkeleton /> },
);

const COPY: Copy<string> = {
  es: "Cargando mapa y buscador",
  en: "Loading map and search",
};

function ExplorerSkeleton() {
  const label = useCopy(COPY);
  return (
    <div
      role="status"
      aria-label={label}
      className="a-card min-h-[680px] animate-pulse"
    />
  );
}

export function LiveExplorerLazy(
  props: React.ComponentProps<typeof LiveExplorer>,
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
    <div ref={ref} className="min-w-0">
      {near ? <LiveExplorer {...props} /> : <ExplorerSkeleton />}
    </div>
  );
}
