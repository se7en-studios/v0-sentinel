import { PlatformDemo } from "@/components/platform-demo";

export function Platform() {
  return (
    <section
      id="plataforma"
      className="relative scroll-mt-20 bg-paper py-20 text-ink md:py-32"
    >
      <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-12">
          <h2 className="t-h2 lg:col-span-7">
            Cómo funciona Sentinel, mirado desde el panel que usamos todos los
            días
          </h2>
          <p className="t-lead max-w-xl lg:col-span-5 lg:self-end">
            Hoy la lectura es satelital. Lo que sigue son capturas reales de
            nuestro panel, sin retoques, y lo que hace cada paso entre que un
            satélite ve calor y alguien recibe un aviso.
          </p>
        </div>
        <PlatformDemo />
      </div>
    </section>
  );
}
