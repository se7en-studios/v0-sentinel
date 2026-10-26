import { CLAIMS } from "@/lib/claims";
import { Reveal } from "@/components/ui/reveal";
import { StatCounter } from "@/components/stats-counter";

const STATS = [
  {
    to: CLAIMS.accuracyPct,
    suffix: " %",
    label: "Precisión objetivo en detección",
  },
  { to: 689, suffix: "+", label: "Propuestas superadas en certámenes" },
  { to: 11, label: "Reconocimientos y programas" },
];

// Continúa el tono oscuro de Plataforma y se desvanece hacia el capítulo siguiente.
export function Stats() {
  return (
    <>
      <section
        aria-label="Cifras"
        className="relative overflow-hidden bg-linear-to-b from-charcoal via-ash to-charcoal py-16 text-[#f4efe2] md:py-24"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto h-64 max-w-3xl -translate-y-1/2 rounded-full bg-leaf/20 blur-[110px]"
        />
        <div
          aria-hidden
          className="bg-noise pointer-events-none absolute inset-0 opacity-[0.05]"
        />
        <dl className="relative mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-3 md:gap-0 md:px-8">
          {STATS.map(({ to, suffix, label }, i) => (
            <Reveal
              key={label}
              delay={i * 120}
              className={`flex flex-col-reverse justify-end gap-3 md:px-8 md:first:pl-0 md:last:pr-0 ${
                i > 0 ? "md:border-l md:border-white/15" : ""
              }`}
            >
              <dt className="t-small max-w-[16rem] opacity-80">{label}</dt>
              <dd className="font-display text-[clamp(3.5rem,8vw,6.5rem)] leading-none tracking-tight text-leaf-bright">
                <StatCounter to={to} suffix={suffix} />
              </dd>
            </Reveal>
          ))}
        </dl>
      </section>
      <div
        aria-hidden
        className="divider-fade-up pointer-events-none relative z-10 -mb-16 h-16"
      />
    </>
  );
}
