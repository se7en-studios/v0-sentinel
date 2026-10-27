import { PlatformDemo } from "@/components/platform-demo";

export function Platform() {
  return (
    <section
      id="plataforma"
      className="a-bone px-5 py-24 font-[family-name:var(--font-geist)] md:px-8 md:py-36"
    >
      <div className="mx-auto max-w-[1100px]">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#4b5750]">
          Cómo funciona
        </p>
        <h2 className="a-title mt-4 max-w-3xl text-[#131a16]">
          Del satélite a tu celular, sin que tengas que mirar un mapa
        </h2>
        <p className="a-sub mt-5 max-w-2xl">
          Leemos los satélites, cruzamos las fuentes y le avisamos a quien tiene
          que salir. Lo que ves abajo es el panel de verdad, no una maqueta.
        </p>
        <PlatformDemo />
      </div>
    </section>
  );
}
