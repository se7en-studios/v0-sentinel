"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { FireMapLiveLazy } from "@/components/ui/fire-map-live-lazy";
import type { LiveFire, LivePlace } from "@/components/ui/fire-map-live";
import type { LocalityStat } from "@/components/locality-stats";
import { PLACES } from "@/lib/places";
import { RISK_WORD } from "@/lib/landing-data/risk";
import { useCopy, useLang } from "@/lib/i18n/client";
import type { Copy } from "@/lib/i18n";

const LOCALE = { es: "es-AR", en: "en-US" } as const;

const COPY: Copy<{
  title: string;
  intro: string;
  searchLabel: string;
  placeholder: string;
  clearLabel: string;
  listLabel: string;
  noFiresCountry: string;
  noFires100: string;
  nearestCountry: (km: string) => string;
  kmSuffix: string;
  hotspot: string;
  hotspots: string;
  in50: string;
  in100: string;
  nearestAt: (at: string) => string;
  truncated: string;
  riskToday: string;
  source: (label: string, firesAt: string) => string;
}> = {
  es: {
    title: "Probá con tu localidad",
    intro:
      "Elegí tu pueblo o ciudad y mirá qué focos de calor detectaron los satélites cerca, con los datos de hoy.",
    searchLabel: "Buscar localidad",
    placeholder: "Ej.: Bariloche, Esquel, Epuyén…",
    clearLabel: "Borrar localidad",
    listLabel: "Localidades",
    noFiresCountry:
      "Sin focos de calor detectados en Argentina en las últimas 24 h; no garantiza ausencia de fuego.",
    noFires100:
      "Sin focos de calor detectados en 100 km en las últimas 24 h; no garantiza ausencia de fuego.",
    nearestCountry: (km) => `El foco más cercano del país está a ${km} km.`,
    kmSuffix: "al foco de calor más cercano",
    hotspot: "foco",
    hotspots: "focos",
    in50: "en 50 km",
    in100: "en 100 km",
    nearestAt: (at) => `Más cercano detectado ${at}.`,
    truncated: " El mapa dibuja solo los 150 focos más intensos del país.",
    riskToday: "Riesgo hoy",
    source: (label, firesAt) =>
      `Fuente: NASA FIRMS, ${label}, últimas 24 h. ${firesAt}. Son focos de calor satelitales, no incendios confirmados, con demora de horas.`,
  },
  en: {
    title: "Try it with your town",
    intro:
      "Pick your town or city and see which fire hotspots satellites detected nearby, with today's data.",
    searchLabel: "Search for a town",
    placeholder: "E.g. Bariloche, Esquel, Epuyén…",
    clearLabel: "Clear town",
    listLabel: "Towns",
    noFiresCountry:
      "No fire hotspots detected in Argentina in the last 24 h; this does not guarantee there is no fire.",
    noFires100:
      "No fire hotspots detected within 100 km in the last 24 h; this does not guarantee there is no fire.",
    nearestCountry: (km) => `The nearest hotspot in the country is ${km} km away.`,
    kmSuffix: "to the nearest fire hotspot",
    hotspot: "hotspot",
    hotspots: "hotspots",
    in50: "within 50 km",
    in100: "within 100 km",
    nearestAt: (at) => `Nearest detected ${at}.`,
    truncated: " The map only draws the 150 most intense hotspots in the country.",
    riskToday: "Risk today",
    source: (label, firesAt) =>
      `Source: NASA FIRMS, ${label}, last 24 h. ${firesAt}. These are satellite fire hotspots, not confirmed wildfires, and arrive with a delay of hours.`,
  },
};

const MAX_OPTIONS = 8;
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
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
  const c = useCopy(COPY);
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
    chosen === null ? null : { lat: PLACES[chosen][2], lng: PLACES[chosen][3] };

  return (
    <div className="a-card min-w-0 overflow-hidden">
      <section
        aria-labelledby={`${uid}-title`}
        className="relative z-20 border-b border-a-line p-5 sm:p-6"
      >
        <h3
          id={`${uid}-title`}
          className="font-[family-name:var(--font-display)] text-[clamp(1.5rem,2.6vw,2rem)] leading-tight text-[#e3f6dc]"
        >
          {c.title}
        </h3>
        <p className="mt-1.5 text-[0.9375rem] text-a-mute">{c.intro}</p>

        <div className="relative mt-4">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-a-mute"
          />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-label={c.searchLabel}
            aria-expanded={listOpen}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeId}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            placeholder={c.placeholder}
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
            className="min-h-12 w-full rounded-full border border-a-line bg-a-bg pl-11 pr-12 text-base text-[#e3f6dc] placeholder:text-a-mute focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-a-accent"
          />
          {query && (
            <button
              type="button"
              aria-label={c.clearLabel}
              onClick={() => {
                clear();
                inputRef.current?.focus();
              }}
              className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full text-a-mute hover:text-[#e3f6dc] focus-visible:outline-2 focus-visible:outline-a-accent"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          )}
          <ul
            id={listId}
            role="listbox"
            aria-label={c.listLabel}
            hidden={!listOpen}
            className="absolute inset-x-0 top-full z-30 m-0 mt-1.5 max-h-[min(16rem,35dvh)] list-none overflow-y-auto overscroll-contain rounded-xl border border-a-line bg-a-card p-1 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)]"
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
                className={`flex min-h-11 cursor-pointer items-baseline justify-between gap-3 rounded-lg px-3 py-2.5 text-base ${oi === active ? "bg-a-accent/15 text-[#e3f6dc]" : "text-[#e3f6dc]/90"}`}
              >
                <span className="min-w-0 truncate font-medium">
                  {PLACES[pi][0]}
                </span>
                <span className="shrink-0 text-[0.9375rem] text-a-mute">
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
  const c = useCopy(COPY);
  const lang = useLang();
  const [km, n50, n100, at] = stat;
  const fmt = (n: number) => n.toLocaleString(LOCALE[lang]);
  return (
    <div className="rounded-xl border border-a-line bg-a-bg p-4">
      <p className="text-[0.9375rem] font-medium text-[#e3f6dc]">
        {PLACES[i][0]}, {PLACES[i][1]}
      </p>
      {km === null ? (
        <p className="mt-2 text-base text-a-accent">
          {c.noFiresCountry}
        </p>
      ) : n100 === 0 ? (
        <>
          <p className="mt-2 text-base text-a-accent">
            {c.noFires100}
          </p>
          <p className="mt-1.5 text-[0.9375rem] text-a-mute">
            {c.nearestCountry(fmt(km))}
          </p>
        </>
      ) : (
        <>
          <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-[#e3f6dc]">
            {fmt(km)} km
            <span className="ml-2 text-[0.9375rem] font-normal text-a-mute">
              {c.kmSuffix}
            </span>
          </p>
          <p className="mt-1.5 text-[0.9375rem] tabular-nums text-[#e3f6dc]">
            {fmt(n50)} {n50 === 1 ? c.hotspot : c.hotspots} {c.in50} ·{" "}
            {fmt(n100)} {n100 === 1 ? c.hotspot : c.hotspots} {c.in100}
          </p>
          <p className="mt-1 text-[0.9375rem] text-a-mute">
            {c.nearestAt(at)}
            {truncated && c.truncated}
          </p>
        </>
      )}
      {place && (
        <p
          className="mt-2 text-[0.9375rem] tabular-nums"
          style={{ color: RISK_ON_DARK[place.label] }}
        >
          {c.riskToday}: {RISK_WORD[lang][place.label]} · {Math.round(place.temperature)} °C ·{" "}
          {Math.round(place.humidity)}% · {Math.round(place.windSpeed)} km/h
        </p>
      )}
      <p className="mt-2 text-[0.8125rem] text-a-mute">
        {c.source(sourceLabel, firesAt)}
      </p>
    </div>
  );
}
