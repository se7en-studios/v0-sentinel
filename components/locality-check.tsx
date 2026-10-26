"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { FireMapLiveLazy } from "@/components/ui/fire-map-live-lazy";
import type { LiveFire, LivePlace } from "@/components/ui/fire-map-live";
import type { LocalityStat } from "@/components/locality-stats";
import { PLACES } from "@/lib/places";

const MAX_OPTIONS = 8;
const norm = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const INDEX = PLACES.map(([name, province]) => norm(`${name} ${province}`));
const NAMES = PLACES.map(([name]) => norm(name));

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
      <section aria-labelledby={`${uid}-title`} className="mb-10">
        <h3 id={`${uid}-title`} className="t-h2">
          Probá con tu localidad
        </h3>
        <p className="t-body mt-2 max-w-xl text-ink/80">
          Elegí tu pueblo o ciudad y mirá qué focos de calor detectaron los
          satélites cerca, con los datos de hoy.
        </p>

        <label
          htmlFor={`${uid}-input`}
          className="mt-5 block text-sm font-semibold"
        >
          Tu localidad
        </label>
        <div className="relative mt-1.5 max-w-xl">
          <input
            id={`${uid}-input`}
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={listOpen}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeId}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            placeholder="Ej.: Bariloche, Esquel, Epuyén"
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
            className="min-h-12 w-full rounded-sm border border-ink bg-white/50 pl-3.5 pr-12 text-base text-ink placeholder:text-ink/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          />
          {query && (
            <button
              type="button"
              aria-label="Borrar localidad"
              onClick={() => {
                clear();
                inputRef.current?.focus();
              }}
              className="absolute right-0.5 top-1/2 grid size-11 -translate-y-1/2 place-items-center text-ink/80 hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          )}
          <ul
            id={listId}
            role="listbox"
            aria-label="Localidades"
            hidden={!listOpen}
            className="absolute inset-x-0 top-full z-30 m-0 mt-1 max-h-[min(16rem,35dvh)] list-none overflow-y-auto overscroll-contain rounded-sm border border-ink bg-paper p-0"
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
                className={`flex min-h-11 cursor-pointer items-baseline justify-between gap-3 border-b rule px-3.5 py-2.5 text-base last:border-b-0 ${oi === active ? "bg-ink text-paper" : "text-ink"}`}
              >
                <span className="min-w-0 truncate font-medium">
                  {PLACES[pi][0]}
                </span>
                <span className="t-small shrink-0 opacity-75">
                  {PLACES[pi][1]}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div role="status" aria-live="polite" className="mt-6 empty:hidden">
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
  const name = PLACES[i][0];

  let sentence: string;
  if (km === null) {
    sentence = `${name}: no hay focos de calor detectados en Argentina en las últimas 24 h. Eso no garantiza que no haya fuego.`;
  } else if (n100 === 0) {
    sentence = `${name}: no hay focos de calor a menos de 100 km en las últimas 24 h; el más cercano del país está a ${fmt(km)} km. Eso no garantiza que no haya fuego.`;
  } else {
    sentence = `${name}: el foco más cercano está a ${fmt(km)} km; hay ${fmt(n100)} ${n100 === 1 ? "foco" : "focos"} a menos de 100 km en las últimas 24 h.`;
  }

  const rows: [string, string][] = [];
  if (km !== null) {
    rows.push(
      ["Foco más cercano", `${fmt(km)} km`],
      ["Focos a menos de 50 km", fmt(n50)],
      ["Focos a menos de 100 km", fmt(n100)],
    );
  }
  if (place) {
    rows.push([
      "Riesgo hoy",
      `${place.label} · ${Math.round(place.temperature)} °C · ${Math.round(place.humidity)}% · ${Math.round(place.windSpeed)} km/h`,
    ]);
  }

  return (
    <div className="max-w-xl border-t border-ink pt-4">
      <p className="font-[family-name:var(--font-serif)] text-2xl leading-snug">
        {sentence}
      </p>
      {rows.length > 0 && (
        <table className="mt-4 w-full border-collapse text-left text-sm tabular-nums">
          <caption className="sr-only">Detalle para {name}</caption>
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k} className="border-y rule">
                <th scope="row" className="py-2 pr-3 font-normal">
                  {k}
                </th>
                <td className="py-2 text-right font-semibold">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="t-caption mt-2">
        {km !== null && n100 > 0 && `Foco más cercano detectado ${at}. `}
        {truncated &&
          "El mapa dibuja solo los 150 focos más intensos del país. "}
        Fuente: NASA FIRMS, {sourceLabel}, últimas 24 h. {firesAt}. Son focos de
        calor satelitales, no incendios confirmados, con demora de horas.
      </p>
    </div>
  );
}
