import { CLAIMS } from "@/lib/claims";

const STATS = [
  { value: `${CLAIMS.accuracyPct} %`, label: "Precisión objetivo en detección" },
  { value: "689+", label: "Propuestas superadas en certámenes" },
  { value: "11", label: "Reconocimientos y programas" },
];

export function Stats() {
  return (
    <section aria-label="Cifras" className="bg-background py-12 text-foreground md:py-16">
      <dl className="mx-auto grid max-w-6xl gap-8 px-5 md:grid-cols-3 md:px-8">
        {STATS.map(({ value, label }) => (
          <div key={label} className="flex flex-col-reverse justify-end border-t border-foreground/20 pt-4">
            <dt className="t-small mt-1 opacity-80">{label}</dt>
            <dd className="t-h2 text-leaf">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
