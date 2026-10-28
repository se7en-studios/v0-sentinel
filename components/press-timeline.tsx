"use client";

import { useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import type { PressMention, PressTag } from "@/lib/press-mentions";
import { formatDate } from "@/lib/format-date";
import { aFocus } from "@/components/a-section";
import { useCopy, useLang } from "@/lib/i18n/client";
import type { Copy, Lang } from "@/lib/i18n";

const ALL = "all";
type Filter = PressTag | typeof ALL;

const COPY: Copy<{
  tags: Record<PressTag, string>;
  all: string;
  eyebrow: string;
  heading: string;
  notes: string;
  outlets: string;
  filter: string;
  newTab: string;
}> = {
  es: {
    tags: {
      ILAN: "Premio ILAN",
      Sadosky: "Premios Sadosky",
      JIJE: "JIJE, UNL",
      "Premios Verdes": "Premios Verdes",
      Perfil: "Perfiles",
    },
    all: "Todas",
    eyebrow: "Prensa",
    heading: "En los medios.",
    notes: "notas",
    outlets: "medios",
    filter: "Filtrar notas por hito",
    newTab: " (abre en pestaña nueva)",
  },
  en: {
    tags: {
      ILAN: "Premio ILAN",
      Sadosky: "Premios Sadosky",
      JIJE: "JIJE, UNL",
      "Premios Verdes": "Premios Verdes",
      Perfil: "Profiles",
    },
    all: "All",
    eyebrow: "Press",
    heading: "In the media.",
    notes: "articles",
    outlets: "outlets",
    filter: "Filter articles by milestone",
    newTab: " (opens in a new tab)",
  },
};

// Miniatura redonda de la nota dentro del badge del medio. Si la imagen no carga, queda la inicial del medio.
function Thumb({ src, outlet }: { src: string; outlet: string }) {
  const [broken, setBroken] = useState(false);
  const base = "size-7 shrink-0 rounded-full";
  if (!src || broken)
    return (
      <span aria-hidden className={`${base} grid place-items-center bg-[#131a16]/10 text-xs font-semibold`}>
        {outlet[0]}
      </span>
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element -- portadas de terceros enlazadas directo (no se re-alojan)
    <img
      src={src}
      alt=""
      width={28}
      height={28}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
      className={`${base} object-cover ring-1 ring-[#131a16]/15`}
    />
  );
}

const monthOf = (date: string, lang: Lang) =>
  new Date(date).toLocaleDateString(lang === "en" ? "en-US" : "es-AR", { month: "long", year: "numeric", timeZone: "UTC" });

// Línea de tiempo de prensa: el riel se llena con el scroll, los puntos se encienden al llegar y las notas se filtran por hito.
export function PressTimeline({ items }: { items: PressMention[] }) {
  const reduce = useReducedMotion();
  const c = useCopy(COPY);
  const lang = useLang();
  const [filter, setFilter] = useState<Filter>(ALL);
  const listRef = useRef<HTMLOListElement>(null);

  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 70%", "end 60%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.4 });

  const tags = useMemo(() => [...new Set(items.map((m) => m.tag))], [items]);
  const outlets = useMemo(() => new Set(items.map((m) => m.outlet)).size, [items]);
  const shown = useMemo(
    () => (filter === ALL ? items : items.filter((m) => m.tag === filter)),
    [items, filter],
  );
  // Ya viene ordenado de más nuevo a más viejo; se agrupa por mes conservando ese orden.
  const groups = useMemo(() => {
    const out: { label: string; notes: PressMention[] }[] = [];
    for (const m of shown) {
      const label = monthOf(m.date, lang);
      const last = out[out.length - 1];
      if (last?.label === label) last.notes.push(m);
      else out.push({ label, notes: [m] });
    }
    return out;
  }, [shown, lang]);

  const count = (f: Filter) => (f === ALL ? items.length : items.filter((m) => m.tag === f).length);

  return (
    <div className="grid gap-10 md:grid-cols-[minmax(0,22rem)_1fr] md:gap-16">
      <div className="md:sticky md:top-28 md:self-start">
        <p className="text-[0.9375rem] font-medium uppercase tracking-[0.16em] text-[#4b5750]">{c.eyebrow}</p>
        <h3 className="a-display-m mt-3 !text-[clamp(2.25rem,4.2vw,3.75rem)]">{c.heading}</h3>
        <dl className="mt-8 flex gap-8">
          <div>
            <dt className="text-[0.9375rem] text-[#4b5750]">{c.notes}</dt>
            <dd className="font-[family-name:var(--font-display)] text-5xl leading-none tabular-nums text-[#0f7a4f]">{items.length}</dd>
          </div>
          <div>
            <dt className="text-[0.9375rem] text-[#4b5750]">{c.outlets}</dt>
            <dd className="font-[family-name:var(--font-display)] text-5xl leading-none tabular-nums text-[#c2561a]">{outlets}</dd>
          </div>
        </dl>
        <div role="group" aria-label={c.filter} className="mt-8 flex flex-wrap gap-2">
          {([ALL, ...tags] as Filter[]).map((f) => {
            const on = f === filter;
            return (
              <button
                key={f}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(f)}
                className={`min-h-11 rounded-full border px-4 text-[0.9375rem] font-medium transition-colors ${aFocus} ${
                  on
                    ? "border-[#131a16] bg-[#131a16] text-[#e6e3dc]"
                    : "border-[#131a16]/25 text-[#131a16] hover:border-[#0f7a4f] hover:text-[#0f7a4f]"
                }`}
              >
                {f === ALL ? c.all : c.tags[f]} <span className="tabular-nums opacity-60">{count(f)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative min-w-0 pl-8 md:pl-12">
        <span aria-hidden className="absolute bottom-0 left-[0.4375rem] top-0 w-px bg-[#131a16]/15 md:left-[0.9375rem]" />
        <motion.span
          aria-hidden
          style={{ scaleY: reduce ? 1 : fill }}
          className="absolute bottom-0 left-[0.3125rem] top-0 w-[3px] origin-top rounded-full bg-gradient-to-b from-[#0f7a4f] to-[#c2561a] md:left-[0.8125rem]"
        />
        <ol ref={listRef} aria-live="polite" className="space-y-12">
          {groups.map((g) => (
            <li key={g.label}>
              <p className="sticky top-20 z-10 -ml-1 mb-4 inline-block bg-[#e6e3dc] py-1 pr-3 text-[0.9375rem] font-medium uppercase tracking-[0.16em] text-[#2f6b50]">
                {g.label}
              </p>
              <ul className="space-y-3">
                {g.notes.map((m) => (
                  <motion.li
                    key={m.url}
                    initial={reduce ? false : { opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                    transition={{ duration: 0.5, ease: [0.22, 0.8, 0.24, 1] }}
                    className="relative"
                  >
                    <span aria-hidden className="absolute -left-[1.9rem] top-7 size-3 rounded-full border-2 border-[#0f7a4f] bg-[#e6e3dc] md:-left-[2.9rem]" />
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group block rounded-2xl border border-[#131a16]/15 bg-white/35 px-5 py-5 transition duration-300 hover:-translate-y-0.5 hover:border-[#0f7a4f]/60 hover:bg-white/70 md:px-6 ${aFocus}`}
                    >
                      <span className="flex items-start justify-between gap-4">
                        <span className="block font-[family-name:var(--font-display)] text-[clamp(1.125rem,1.8vw,1.5rem)] leading-[1.2]">
                          {m.title}
                          <span className="sr-only">{c.newTab}</span>
                        </span>
                        <span aria-hidden className="text-2xl text-[#131a16]/40 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#0f7a4f]">↗</span>
                      </span>
                      <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.9375rem] text-[#4b5750]">
                        <span className="inline-flex items-center gap-2 rounded-full border border-[#131a16]/25 py-0.5 pl-0.5 pr-3 font-medium text-[#131a16]">
                          <Thumb src={m.image} outlet={m.outlet} />
                          {m.outlet}
                        </span>
                        <span>{formatDate(m.date, "short", lang)}</span>
                        <span className="text-[#2f6b50]">{c.tags[m.tag]}</span>
                      </span>
                    </a>
                  </motion.li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
