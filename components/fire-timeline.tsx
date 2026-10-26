import dynamic from "next/dynamic";
import { CLAIMS } from "@/lib/claims";

// ponytail: el simulador está bajo el pliegue; su JS no debe competir con el hero en la hidratación.
const FireSimulator = dynamic(() =>
  import("@/components/fire-simulator").then((m) => m.FireSimulator),
);

export function FireTimeline() {
  return (
    <section
      id="linea-de-tiempo"
      className="scroll-mt-20 bg-paper py-20 text-ink md:py-32"
    >
      <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
        <div className="grid gap-8 lg:grid-cols-12">
          <h2 className="t-h2 text-balance lg:col-span-7">
            El mismo incendio, visto con dos relojes distintos
          </h2>
          <p className="t-lead text-ink/80 lg:col-span-5 lg:col-start-8">
            Un foco que nadie ve crece de forma exponencial hasta que sube la
            columna de humo. Mové el minuto y compará qué tamaño tiene cuando
            llega la brigada si la alerta sale a los {CLAIMS.detectionMinutes} minutos (objetivo) o si hay que
            esperar a que alguien llame.
          </p>
        </div>
        <div className="mt-12 md:mt-16">
          <FireSimulator />
        </div>
      </div>
    </section>
  );
}
