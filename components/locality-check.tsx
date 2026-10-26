"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { FireMapLiveLazy } from "@/components/ui/fire-map-live-lazy";
import type { LiveFire, LivePlace } from "@/components/ui/fire-map-live";
import type { LocalityStat } from "@/components/locality-stats";
import { PLACES } from "@/lib/places";

const MAX_OPTIONS = 8;
const norm = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const INDEX = PLACES.map(([name, province]) => norm(`${name} ${province}`));
const NAMES = PLACES.map(([name]) => norm(name));

// Brighter than RISK_STYLE.text, which is tuned for the light background.
const RISK_ON_DARK = {
  Bajo: "#5fe3a1",
  Moderado: "#f1e06b",
  Alto: "#f1b46b",
  Extremo: "#ff8f85",
} as const;

function search(q: string): number[] {
  const n = norm(q.trim());
  const starts: number[] = [];
  const contains: number[] = [];
  PLACES.forEach((_, i) => {
    if (!n || NAMES[i].startsWith(n)) starts.push(i);
    else if (INDEX[i].includes(n)) contains.push(i);
  });
  return [...starts, ...contains].slice(0, MAX_OPTIONS);
}

interface Props {
  fires: LiveFire[];
  places: LivePlace[];
  readingTime: string;
  sourceLabel: string;
  stats: LocalityStat[];
  totalFires: number;
  firesAt: string;
}

export function LiveExplorer({
  fires,
  places,
  readingTime,
  sourceLabel,
  stats,
  totalFires,
  firesAt,
}: Props) {
  const uid = useId();
  const listId = `${uid}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);

  const options = useMemo(() => search(query), [query]);
  const listOpen = open && options.length > 0;
  const activeId = listOpen ? `${uid}-opt-${options[active]}` : undefined;

  useEffect(() => {
    if (activeId) {
      document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
    }
  }, [activeId]);

  const choose = (i: number) => {
    setChosen(i);
    setQuery(`${PLACES[i][0]}, ${PLACES[i][1]}`);
    setOpen(false);
  };
  const clear = () => {
    setChosen(null);
    setQuery("");
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!listOpen) {
        setOpen(true);
        return;
      }
      const d = e.key === "ArrowDown" ? 1 : -1;
      setActive((a) => (a + d + options.length) % options.length);
    } else if (e.key === "Enter" && listOpen) {
      e.preventDefault();
      choose(options[active]);
    } else if (e.key === "Escape") {
      if (listOpen) {
        e.preventDefault();
        setOpen(false);
      } else if (query) {
        clear();
      }
    }
  };

  const focus =
    chosen === null
      ? null
      : { lat: PLACES[chosen][2], lng: PLACES[chosen][3] };

  return (
    <div className="min-w-0">
      <section
        aria-labelledby={`${uid}-title`}
        className="glass mb-4 rounded-[20px] p-5"
      >
        <h3 id={`${uid}-title`} className="t-label text-[#5fe3a1]">
          Probá con tu localidad
        </h3>
        <p className="t-small mt-1.5 text-[#f4efe2]/75">
          Elegí tu pueblo o ciudad y mirá qué focos de calor detectaron los
          satélites cerca, con los datos de hoy.
        </p>

        <div className="relative mt-3">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-[#f4efe2]/60"
          />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-label="Buscar localidad"
            aria-expanded={listOpen}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeId}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            placeholder="Ej.: Bariloche, Esquel, Epuyén…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setChosen(null);
              setActive(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={onKeyDown}
            className="min-h-12 w-full rounded-xl border border-white/20 bg-[#12110e]/70 pl-11 pr-12 text-base text-[#f4efe2] placeholder:text-[#f4efe2]/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5fe3a1]"
          />
          {query && (
            <button
              type="button"
              aria-label="Borrar localidad"
              onClick={() => {
                clear();
                inputRef.current?.focus();
              }}
              className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-lg text-[#f4efe2]/80 hover:text-[#f4efe2] focus-visible:outline-2 focus-visible:outline-[#5fe3a1]"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          )}
          <ul
            id={listId}
            role="listbox"
            aria-label="Localidades"
            hidden={!listOpen}
            className="absolute inset-x-0 top-full z-30 m-0 mt-1.5 max-h-[min(16rem,35dvh)] list-none overflow-y-auto overscroll-contain rounded-xl border border-white/15 bg-[#1d1b17] p-1 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)]"
          >
            {options.map((pi, oi) => (
              <li
                key={pi}
                id={`${uid}-opt-${pi}`}
                role="option"
                aria-selected={oi === active}
                onMouseDown={(e) => e.preventDefault()}
                onMouseMove={() => setActive(oi)}
                onClick={() => choose(pi)}
                className={`flex min-h-11 cursor-pointer items-baseline justify-between gap-3 rounded-lg px-3 py-2.5 text-base ${oi === active ? "bg-[#5fe3a1]/15 text-[#f4efe2]" : "text-[#f4efe2]/90"}`}
              >
                <span className="min-w-0 truncate font-medium">
                  {PLACES[pi][0]}
                </span>
                <span className="t-small shrink-0 text-[#f4efe2]/70">
                  {PLACES[pi][1]}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div role="status" aria-live="polite" className="mt-4 empty:hidden">
          {chosen !== null && (
            <Result
              i={chosen}
              stat={stats[chosen]}
              place={places.find((p) => norm(p.name) === NAMES[chosen])}
              firesAt={firesAt}
              sourceLabel={sourceLabel}
              truncated={totalFires > fires.length}
            />
          )}
        </div>
      </section>

      <FireMapLiveLazy
        fires={fires}
        places={places}
        readingTime={readingTime}
        sourceLabel={sourceLabel}
        focus={focus}
        onFocusClear={clear}
      />
    </div>
  );
}

function Result({
  i,
  stat,
  place,
  firesAt,
  sourceLabel,
  truncated,
}: {
  i: number;
  stat: LocalityStat;
  place: LivePlace | undefined;
  firesAt: string;
  sourceLabel: string;
  truncated: boolean;
}) {
  const [km, n50, n100, at] = stat;
  const fmt = (n: number) => n.toLocaleString("es-AR");
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <p className="t-label text-[#f4efe2]/85">
        {PLACES[i][0]}, {PLACES[i][1]}
      </p>
      {km === null ? (
        <p className="t-body mt-2 text-[#5fe3a1]">
          Sin focos de calor detectados en Argentina en las últimas 24 h; no
          garantiza ausencia de fuego.
        </p>
      ) : n100 === 0 ? (
        <>
          <p className="t-body mt-2 text-[#5fe3a1]">
            Sin focos de calor detectados en 100 km en las últimas 24 h; no
            garantiza ausencia de fuego.
          </p>
          <p className="t-small mt-1.5 text-[#f4efe2]/80">
            El foco más cercano del país está a {fmt(km)} km.
          </p>
        </>
      ) : (
        <>
          <p className="mt-2 font-heading text-3xl font-semibold tabular-nums tracking-tight text-ember">
            {fmt(km)} km
            <span className="t-small ml-2 font-normal text-[#f4efe2]/80">
              al foco de calor más cercano
            </span>
          </p>
          <p className="t-small mt-1.5 tabular-nums text-[#f4efe2]/90">
            {fmt(n50)} {n50 === 1 ? "foco" : "focos"} en 50 km · {fmt(n100)}{" "}
            {n100 === 1 ? "foco" : "focos"} en 100 km
          </p>
          <p className="t-small mt-1 text-[#f4efe2]/75">
            Más cercano detectado {at}.
            {truncated &&
              " El mapa dibuja solo los 150 focos más intensos del país."}
          </p>
        </>
      )}
      {place && (
        <p
          className="t-small mt-2 tabular-nums"
          style={{ color: RISK_ON_DARK[place.label] }}
        >
          Riesgo hoy: {place.label} · {Math.round(place.temperature)} °C ·{" "}
          {Math.round(place.humidity)}% · {Math.round(place.windSpeed)} km/h
        </p>
      )}
      <p className="t-small mt-2 text-[#f4efe2]/70">
        Fuente: NASA FIRMS, {sourceLabel}, últimas 24 h. {firesAt}. Son focos de
        calor satelitales, no incendios confirmados, con demora de horas.
      </p>
    </div>
  );
}
