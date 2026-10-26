"use client";

import { useEffect, useRef } from "react";
import { BarChart3, MessageCircle, Radar, Satellite } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Spotlight } from "@/components/ui/spotlight";

// Las animaciones corren solo mientras el bento está en pantalla (data-live en la raíz).
const CSS = `
@keyframes bn-ping{0%{transform:scale(.4);opacity:.8}100%{transform:scale(2.6);opacity:0}}
@keyframes bn-orbit{to{transform:rotate(360deg)}}
@keyframes bn-bar{from{transform:scaleY(.08)}to{transform:scaleY(1)}}
@keyframes bn-blink{0%,100%{opacity:.35}50%{opacity:1}}
.bn-anim{animation-play-state:paused}
[data-live="true"] .bn-anim{animation-play-state:running}
.bn-ping{animation:bn-ping 2.4s ease-out infinite}
.bn-orbit{animation:bn-orbit 16s linear infinite}
.bn-bar{transform-origin:bottom;animation:bn-bar 1.2s cubic-bezier(.22,.8,.24,1) both}
.bn-blink{animation:bn-blink 1.6s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.bn-ping,.bn-orbit,.bn-bar,.bn-blink{animation:none}}
`;

const CARD =
  "glass flex min-w-0 flex-col overflow-hidden rounded-[20px] p-6 transition-transform duration-300 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 md:p-7";

function Head({
  icon: Icon,
  title,
  text,
  chip,
}: {
  icon: typeof Radar;
  title: string;
  text: string;
  chip?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-leaf-bright/15 text-leaf-bright">
          <Icon className="size-5" aria-hidden />
        </span>
        {chip && (
          <span className="t-label rounded-full border border-white/20 px-2.5 py-1 text-[#f4efe2]/85">
            {chip}
          </span>
        )}
      </div>
      <h3 className="t-h3 mt-4">{title}</h3>
      <p className="t-body mt-2 opacity-80">{text}</p>
    </div>
  );
}

function ChannelViz() {
  return (
    <div aria-hidden className="mt-6 grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl bg-[#0b141a] p-3 text-[13px] text-[#e9edef]">
        <p className="text-xs text-[#8696a0]">WhatsApp · ejemplo</p>
        <div className="mt-2 rounded-lg rounded-tl-sm bg-[#202c33] px-3 py-2">
          Foco verificado a 9 km. Viento hacia el SE.
          <span className="mt-1 block text-right text-xs text-[#8696a0]">14:32</span>
        </div>
      </div>
      <div className="rounded-xl bg-white/6 p-3 text-[13px]">
        <p className="text-xs opacity-70">Consola web · ejemplo</p>
        {["Foco 1 · verificado", "Foco 2 · en revisión"].map((r, i) => (
          <div key={r} className="mt-2 flex items-center gap-2 rounded-lg bg-white/8 px-3 py-2">
            <span className={`bn-anim bn-blink size-2 rounded-full ${i ? "bg-leaf-bright" : "bg-ember"}`} />
            {r}
          </div>
        ))}
      </div>
    </div>
  );
}

function BarsViz() {
  const h = [38, 52, 30, 64, 46, 80, 58];
  return (
    <div aria-hidden className="mt-6">
      <div className="flex h-24 items-end gap-2">
        {h.map((v, i) => (
          <span
            key={i}
            className={`bn-anim bn-bar flex-1 rounded-t-md ${i === 5 ? "bg-ember" : "bg-leaf-bright/70"}`}
            style={{ height: `${v}%`, animationDelay: `${i * 90}ms` }}
          />
        ))}
      </div>
      <p className="t-small mt-2 opacity-70">Ilustrativo · focos por semana</p>
    </div>
  );
}

function OrbitViz() {
  return (
    <div aria-hidden className="relative mx-auto mt-6 grid size-36 place-items-center">
      <span className="absolute inset-0 rounded-full border border-dashed border-white/25" />
      <span className="size-12 rounded-full bg-linear-to-br from-leaf to-leaf-bright/60 shadow-[0_0_40px_-6px_rgb(95_227_161/0.6)]" />
      <span className="bn-anim bn-orbit absolute inset-0">
        <Satellite className="absolute -top-2.5 left-1/2 size-5 -translate-x-1/2 rotate-45 text-[#f4efe2]" />
      </span>
    </div>
  );
}

function MapViz() {
  return (
    <div
      aria-hidden
      className="relative mt-6 h-40 overflow-hidden rounded-xl bg-[#0b1511] ring-1 ring-white/10"
    >
      <svg viewBox="0 0 400 160" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice">
        {[0, 1, 2, 3].map((i) => (
          <path
            key={i}
            d={`M-10 ${40 + i * 30} C 80 ${10 + i * 34}, 150 ${90 + i * 18}, 230 ${50 + i * 26} S 360 ${20 + i * 30}, 420 ${60 + i * 24}`}
            fill="none"
            stroke="rgb(95 227 161 / 0.22)"
            strokeWidth="1"
          />
        ))}
        <path d="M70 130 L190 78" stroke="rgb(244 239 226 / 0.5)" strokeWidth="1.5" strokeDasharray="4 5" fill="none" />
      </svg>
      <span className="absolute left-[47%] top-[48%] size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember" />
      <span className="bn-anim bn-ping absolute left-[47%] top-[48%] size-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ember" />
      <span className="absolute left-[17%] top-[80%] size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-[#f4efe2]" />
      <span className="t-label absolute bottom-2 right-3 text-[#f4efe2]/80">Ilustrativo</span>
    </div>
  );
}

export function PlatformBento() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      el.dataset.live = String(e.isIntersecting);
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} data-live="false" className="mt-20 md:mt-24">
      <style>{CSS}</style>
      <Reveal>
        <h3 className="t-h2 max-w-2xl">
          Lo que rodea{" "}
          <span className="font-display font-normal text-leaf-bright">la alerta</span>
        </h3>
      </Reveal>
      <div className="mt-10 grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-6">
        <Reveal className="min-w-0 lg:col-span-4">
          <Spotlight as="article" className={`${CARD} h-full`}>
            <Head
              icon={MessageCircle}
              title="Integración con brigadas"
              text="Las alertas llegan por los canales que ya usan: WhatsApp y consola web."
            />
            <ChannelViz />
          </Spotlight>
        </Reveal>
        <Reveal delay={100} className="min-w-0 lg:col-span-2">
          <Spotlight as="article" className={`${CARD} h-full`}>
            <Head
              icon={BarChart3}
              title="Reportes y analítica"
              text="Historial de focos, tiempos de respuesta y zonas recurrentes para planificar la temporada."
            />
            <BarsViz />
          </Spotlight>
        </Reveal>
        <Reveal delay={100} className="min-w-0 lg:col-span-2">
          <Spotlight as="article" className={`${CARD} h-full`}>
            <Head
              icon={Satellite}
              title="Cobertura satelital"
              text="Lectura continua las 24 h sobre la región, con VIIRS, MODIS y GOES-19."
            />
            <OrbitViz />
          </Spotlight>
        </Reveal>
        <Reveal delay={200} className="min-w-0 lg:col-span-4">
          <Spotlight as="article" className={`${CARD} h-full`}>
            <Head
              icon={Radar}
              chip="Se suma de forma progresiva"
              title="Drones y sensores en territorio"
              text="Complementan al satélite para confirmar un foco de cerca. Se incorporan de a poco; hoy la lectura es satelital."
            />
            <MapViz />
          </Spotlight>
        </Reveal>
      </div>
    </div>
  );
}
