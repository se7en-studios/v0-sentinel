"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Chapter, Eyebrow } from "@/components/ui/chapter";
import { Reveal } from "@/components/ui/reveal";
import { pressMentions } from "@/lib/press-mentions";

type Achievement = { title: string; badge: string; detail: string; href?: string };

const noteFor = (outlet: string) => pressMentions.find((m) => m.outlet === outlet)?.url;

const competitions: Achievement[] = [
  {
    title: "Premios ILAN 2025",
    badge: "Ganador",
    detail: "Innovación tecnológica universitaria, con final en Tel Aviv.",
    href: noteFor("UTN"),
  },
  {
    title: "JIJE 20 años, UNL",
    badge: "Ganador",
    detail: "Primer puesto en las Jornadas de Ingeniería de la Universidad Nacional del Litoral.",
  },
  {
    title: "Premios Sadosky 2025",
    badge: "Ganador",
    detail: "Premios de la Cámara de la Industria Argentina del Software (CESSI).",
    href: noteFor("CESSI"),
  },
  {
    title: "Usina Emprendedores, CAC",
    badge: "Programa",
    detail: "Programa de la Cámara Argentina de Comercio para escalar startups.",
  },
  {
    title: "Prendete Pitch Day, CICE",
    badge: "Participamos",
    detail: "Competencia de pitch para founders universitarios de Mendoza.",
  },
];

const international: Achievement[] = [
  {
    title: "Premios Verdes 2026",
    badge: "Finalista",
    detail: "Proyectos ambientales finalistas; el premio incluye un viaje a Ecuador.",
  },
  {
    title: "Climate Launchpad Argentina",
    badge: "Finalista",
    detail: "Finalistas nacionales de la competencia global de innovación climática.",
  },
  {
    title: "Impact Startup Competition Perú 2026",
    badge: "Finalista",
    detail: "Startups de impacto ambiental de Latinoamérica.",
  },
  {
    title: "Softlanding en Europa, Piensas.xyz",
    badge: "Programa",
    detail: "Viaje financiado para conectar con el ecosistema tech europeo.",
  },
  {
    title: "Emprelatam y Draper House Americas",
    badge: "Programa",
    detail: "Programa de aceleración para startups de la región.",
  },
  {
    title: "Fondo del Gobierno de Mendoza",
    badge: "USD 3.000",
    detail: "Primer capital no dilutivo, vía fondo provincial de innovación.",
  },
];

const yearOf = (title: string) => title.match(/20\d{2}/)?.[0];

function Track({ label, items }: { label: string; items: Achievement[] }) {
  return (
    <div className="min-w-0">
      
      {/* Vertical en mobile (línea a la izquierda); desde lg, línea de tiempo horizontal con scroll.
          El wrapper deja aire arriba/abajo para que nodos y sombras no se recorten. */}
      <div
        tabIndex={0}
        role="region"
        aria-label={label}
        className="scrollbar-hide lg:-mx-8 lg:overflow-x-auto lg:px-8 lg:pb-8 lg:pt-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <ol className="relative ml-2 grid gap-5 border-l-2 border-primary/25 pl-7 lg:ml-0 lg:grid-flow-col lg:auto-cols-[minmax(200px,1fr)] lg:gap-5 lg:border-l-0 lg:border-t-2 lg:pl-0 lg:pt-8">
          {items.map((a) => {
            const won = a.badge === "Ganador";
            const year = yearOf(a.title);
            return (
              <li key={a.title} className="group relative">
                <span
                  aria-hidden
                  className={`absolute -left-[37px] top-5 h-4 w-4 rounded-full border-[3px] border-background transition-transform duration-300 group-hover:scale-125 lg:-top-[41px] lg:left-5 ${
                    won
                      ? "bg-primary shadow-[0_0_0_4px_rgb(9_89_58/0.2)]"
                      : "bg-foreground/35"
                  }`}
                />
                <div className="h-full rounded-xl border border-foreground/10 bg-white/70 p-4 shadow-[0_10px_30px_-18px_rgba(26,24,18,0.35)] transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_24px_40px_-20px_rgba(26,24,18,0.45)]">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`t-label rounded-full px-2.5 py-1 ${
                        won
                          ? "bg-primary text-white"
                          : "bg-foreground/[0.07] text-foreground/80"
                      }`}
                    >
                      {a.badge}
                    </span>
                    {year && (
                      <span className="t-label tabular-nums text-foreground/70">
                        {year}
                      </span>
                    )}
                  </div>
                  <p className="t-body mt-3 font-semibold leading-snug">
                    {a.href ? (
                      <a
                        href={a.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-foreground/30 underline-offset-4 hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        {a.title}
                        <span className="sr-only"> (abre la nota en pestaña nueva)</span>
                      </a>
                    ) : (
                      a.title
                    )}
                  </p>
                  <p className="t-small mt-1.5 line-clamp-3 text-foreground/80">
                    {a.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

type TabId = "all" | "comp" | "intl";

const TABS: { id: TabId; label: string; items: Achievement[] }[] = [
  { id: "all", label: "Todos", items: [...competitions, ...international] },
  { id: "comp", label: "Competencias", items: competitions },
  { id: "intl", label: "Internacional", items: international },
];

export function AwardsBlock() {
  const [tab, setTab] = useState<TabId>("all");
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = TABS.find((t) => t.id === tab) ?? TABS[0];

  // Patrón WAI-ARIA tabs: flechas mueven foco y selección; solo la pestaña activa entra en el tab order.
  const onKey = (e: KeyboardEvent, i: number) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    const to = e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : (i + step + TABS.length) % TABS.length;
    if (!step && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    setTab(TABS[to].id);
    refs.current[to]?.focus();
  };

  return (
    <Reveal>
      <div role="tablist" aria-label="Filtrar logros" className="mb-6 inline-flex max-w-full flex-wrap gap-2">
        {TABS.map((t, i) => {
          const on = t.id === tab;
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`logros-tab-${t.id}`}
              aria-selected={on}
              aria-controls="logros-panel"
              tabIndex={on ? 0 : -1}
              onClick={() => setTab(t.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={`min-h-11 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                on
                  ? "bg-primary text-white"
                  : "border border-foreground/15 text-foreground/80 hover:border-primary hover:text-primary"
              }`}
            >
              {t.label}
              <span className="ml-1.5 tabular-nums opacity-80">{t.items.length}</span>
            </button>
          );
        })}
      </div>
      <div id="logros-panel" role="tabpanel" aria-labelledby={`logros-tab-${tab}`}>
        <Track key={tab} label={`Logros: ${current.label}`} items={current.items} />
      </div>
    </Reveal>
  );
}

// Compatibilidad: el capítulo completo vive en Proof.
export function Awards() {
  return (
    <Chapter id="noticias">
      <Eyebrow>Logros</Eyebrow>
      <h2 className="t-h2 mb-12 max-w-3xl">Lo que ya pasó, con fuente.</h2>
      <AwardsBlock />
    </Chapter>
  );
}
