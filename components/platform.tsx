import { Chapter, Eyebrow } from "@/components/ui/chapter";
import { PlatformDemo } from "@/components/platform-demo";
import { PlatformBento } from "@/components/bento";

export function Platform() {
  return (
    <>
      {/* Degradé de entrada: se monta sobre el pie del capítulo anterior. */}
      <div
        aria-hidden
        className="divider-fade-down pointer-events-none relative z-10 -mt-20 h-20"
      />
      <Chapter id="plataforma" tone="dark" className="overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-[-10%] size-[42rem] rounded-full bg-leaf/25 blur-[120px]" />
          <div className="absolute bottom-[-12rem] left-[-12%] size-[34rem] rounded-full bg-leaf-bright/10 blur-[120px]" />
          <div className="bg-noise absolute inset-0 opacity-[0.06]" />
        </div>
        <div className="relative">
          <Eyebrow tone="dark">La plataforma</Eyebrow>
          <h2 className="t-h2 max-w-3xl">
            Del satélite a la brigada, en{" "}
            <span className="font-display font-normal text-leaf-bright">
              cuatro pasos
            </span>
          </h2>
          <p className="t-lead mt-4 max-w-2xl opacity-80">
            Recorré una alerta de ejemplo sobre el panel real: cada paso acerca
            la imagen a lo que ve Sentinel y muestra qué recibe quien tiene que
            actuar.
          </p>
          <div className="mt-12 md:mt-16">
            <PlatformDemo />
          </div>
          <PlatformBento />
        </div>
      </Chapter>
    </>
  );
}
