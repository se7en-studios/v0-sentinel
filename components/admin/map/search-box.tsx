"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MapHandle } from "./types";

const glass =
  "glass rounded-xl border border-[var(--hairline)] shadow-[var(--shadow-1)]";

type Hit = { label: string; lat: number; lng: number };

/** Place / coordinate search with suggestions (Nominatim, Argentina only). */
export function SearchBox({ a }: { a: { mapRef: { current: MapHandle | null } } }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const go = (h: Hit) => {
    a.mapRef.current?.flyTo([h.lng, h.lat], 11.5);
    setOpen(false);
    setQ(h.label.split(",")[0]);
  };

  useEffect(() => {
    const text = q.trim();
    setMsg(null);
    const m = text.match(/^(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)$/);
    if (m) {
      setHits([
        {
          label: `Coordenadas ${m[1]}, ${m[2]}`,
          lat: Number(m[1]),
          lng: Number(m[2]),
        },
      ]);
      return;
    }
    setHits([]);
    return () => abort.current?.abort();
  }, [q]);

  // Nominatim's policy forbids autocomplete, so place names are only searched on submit
  const searchPlace = async (text: string) => {
    if (text.length < 3) return;
    abort.current?.abort();
    abort.current = new AbortController();
    setMsg("Buscando…");
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&countrycodes=ar&format=json&limit=5&accept-language=es`,
        { signal: abort.current.signal },
      );
      const j = (await r.json()) as {
        display_name: string;
        lat: string;
        lon: string;
      }[];
      setMsg(j.length ? null : "Sin resultados en Argentina");
      const found = j.map((x) => ({
        label: x.display_name,
        lat: Number(x.lat),
        lng: Number(x.lon),
      }));
      setHits(found);
      setOpen(true);
      if (found[0]) go(found[0]);
    } catch (err) {
      if ((err as Error).name !== "AbortError") setMsg("No se pudo buscar");
    }
  };

  return (
    <div className="relative w-[min(22rem,calc(100vw-9.5rem))]">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (hits[0]) go(hits[0]);
          else void searchPlace(q.trim());
        }}
        className={cn(
          glass,
          "flex h-10 items-center gap-2 px-3 focus-within:ring-2 focus-within:ring-ring",
        )}
      >
        <Search className="size-3.5 shrink-0 text-foreground/45" aria-hidden />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          onBlur={() => setTimeout(() => setOpen(false), 140)}
          aria-label="Buscar ciudad o coordenadas"
          placeholder="Buscar ciudad (Enter) o lat, lng…"
          className="min-w-0 flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-foreground/40"
        />
        {q && (
          <button
            type="button"
            aria-label="Borrar búsqueda"
            onClick={() => setQ("")}
            className="text-foreground/40 hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </form>
      {open && (hits.length > 0 || msg) && (
        <ul
          className={cn(
            glass,
            "absolute inset-x-0 top-12 z-30 overflow-hidden p-1",
          )}
          role="listbox"
        >
          {msg && (
            <li className="px-2.5 py-2 text-[11.5px] text-foreground/50">
              {msg}
            </li>
          )}
          {hits.map((h) => (
            <li key={`${h.lat},${h.lng}`}>
              <button
                type="button"
                role="option"
                aria-selected="false"
                onMouseDown={() => go(h)}
                className="w-full truncate rounded-lg px-2.5 py-1.5 text-left text-[12px] hover:bg-foreground/[0.06]"
              >
                {h.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

