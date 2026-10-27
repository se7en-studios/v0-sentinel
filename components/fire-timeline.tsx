import dynamic from "next/dynamic";

// Bajo el pliegue: el simulador se descarga aparte para no cargar el TBT inicial.
const FireSimulator = dynamic(
  () => import("@/components/fire-simulator").then((m) => m.FireSimulator),
  {
    loading: () => <div aria-hidden className="a-card h-[640px]" />,
  },
);

export function FireTimeline() {
  return (
    <section
      id="simulador"
      className="a-root relative scroll-mt-20 py-24 md:py-36"
    >
      <div className="mx-auto w-full max-w-[1100px] px-5 md:px-8">
        <p className="a-eyebrow mb-5">Simulador</p>
        <h2 className="a-title mx-auto max-w-3xl text-center text-white">
          La diferencia son los primeros minutos
        </h2>
        <p className="a-sub mx-auto mt-5 max-w-2xl text-center">
          Mismo foco, dos relojes. Movés el minuto y mirás cuánto crece según
          cuándo llega la brigada.
        </p>
        <div className="mt-14">
          <FireSimulator />
        </div>
      </div>
    </section>
  );
}
