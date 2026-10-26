import { Chapter, Eyebrow } from "@/components/ui/chapter";
import dynamic from "next/dynamic";

// ponytail: el simulador está bajo el pliegue; su JS no debe competir con el hero en la hidratación.
const FireSimulator = dynamic(() =>
  import("@/components/fire-simulator").then((m) => m.FireSimulator),
);

export function FireTimeline() {
  return (
    <Chapter id="linea-de-tiempo" tone="light">
      <Eyebrow>Cada minuto cuenta</Eyebrow>
      <h2 className="t-h2 max-w-3xl text-balance">
        La diferencia son los primeros minutos.
      </h2>
      <p className="t-lead mt-5 max-w-2xl opacity-80">
        Mismo incendio, dos relojes. Arrastrá el minuto y mirá cuánto crece
        antes de que llegue la brigada.
      </p>
      <div className="mt-12 md:mt-16">
        <FireSimulator />
      </div>
    </Chapter>
  );
}
