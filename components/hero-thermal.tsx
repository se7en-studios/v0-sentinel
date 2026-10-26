"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Thermometer } from "lucide-react";

// «Patagonia a la lupa» literal: la MISMA foto del hero (mismo URL, sale de caché) con
// grading térmico falso, revelada por una lente que sigue al mouse. Todo es ilustrativo.
// Nada de setState por frame: el rAF escribe variables CSS (--lx/--ly) y dos textos.

const CSS = `
@property --lr { syntax: "<length>"; inherits: true; initial-value: 130px; }
.th-root { --lr: 130px; --lx: -999px; --ly: -999px; --rr: 130px; --hx: 74%; --hy: 30%; transition: --lr .9s cubic-bezier(.2,.7,.2,1); }
@media (min-width: 1024px) { .th-root { --hx: 49%; --hy: 62%; } }
.th-root[data-full="true"] { --lr: 200vmax !important; }
.th-layer { opacity: 0; transition: opacity .4s ease; -webkit-mask-image: radial-gradient(circle var(--lr) at var(--lx) var(--ly), #000 70%, transparent 100%); mask-image: radial-gradient(circle var(--lr) at var(--lx) var(--ly), #000 70%, transparent 100%); }
.th-root[data-lens="on"] .th-layer, .th-root[data-full="true"] .th-layer { opacity: 1; }
.th-annot { opacity: 0; transition: opacity .3s ease; }
.th-root[data-lens="on"]:not([data-full="true"]) .th-annot { opacity: 1; }
.th-hot { background: radial-gradient(circle, rgba(255,226,140,.95) 0 7%, rgba(255,132,36,.8) 22%, rgba(220,60,30,.38) 46%, transparent 70%); animation: th-beat 1.8s ease-in-out infinite; }
@keyframes th-beat { 0%, 100% { transform: translate(-50%,-50%) scale(.82); opacity: .8; } 50% { transform: translate(-50%,-50%) scale(1.12); opacity: 1; } }
.th-ox { position: absolute; left: 0; top: 17vh; animation: th-x 22s linear infinite; }
.th-oy { animation: th-y 22s ease-in-out infinite; }
@keyframes th-x { 0% { transform: translateX(-16vw); opacity: 0; } 4%, 66% { opacity: 1; } 70%, 100% { transform: translateX(112vw); opacity: 0; } }
@keyframes th-y { 0%, 70%, 100% { transform: translateY(0); } 35% { transform: translateY(-5vh); } }
.th-root[data-paused="true"] .th-ox, .th-root[data-paused="true"] .th-oy, .th-root[data-paused="true"] .th-hot { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .th-orbit { display: none; } .th-hot { animation: none; transform: translate(-50%,-50%); } .th-root, .th-layer, .th-annot { transition: none; } }
`;

// Escala térmica falsa: luminancia -> violeta/azul (bosque) .. naranja/amarillo (claros).
const THERMAL_FILTER = "contrast(1.35) brightness(1.1) url(#sentinel-thermal)";
const REDUCE = "(prefers-reduced-motion: reduce)";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function HeroThermal({ startFull = false }: { startFull?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hotRef = useRef<HTMLSpanElement>(null);
  const coordRef = useRef<HTMLSpanElement>(null);
  const tempRef = useRef<HTMLSpanElement>(null);
  const [full, setFull] = useState(startFull);

  useEffect(() => {
    const root = rootRef.current;
    const host = root?.closest("section");
    if (!root || !host) return;

    const fine = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    const reduce = window.matchMedia(REDUCE).matches;
    const small = window.innerWidth < 640;
    root.style.setProperty("--lr", `${small ? 100 : 130}px`);
    root.style.setProperty("--rr", `${small ? 100 : 130}px`);

    let raf = 0;
    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;

    const paint = (px: number, py: number) => {
      const hr = hotRef.current?.getBoundingClientRect();
      const r = host.getBoundingClientRect();
      const hx = hr ? hr.left + hr.width / 2 - r.left : -9999;
      const hy = hr ? hr.top + hr.height / 2 - r.top : -9999;
      const d = Math.hypot(px - hx, py - hy) / 160;
      root.style.setProperty("--lx", `${px.toFixed(1)}px`);
      root.style.setProperty("--ly", `${py.toFixed(1)}px`);
      if (coordRef.current)
        coordRef.current.textContent = `S ${(41.05 + (py / r.height) * 0.3).toFixed(3)}° O ${(71.55 - (px / r.width) * 0.5).toFixed(3)}°`;
      if (tempRef.current)
        tempRef.current.textContent = `≈ ${Math.round(12 + 400 * Math.exp(-d * d))} °C`;
    };

    const io = new IntersectionObserver(([e]) => {
      root.dataset.paused = String(!e.isIntersecting);
    });
    io.observe(host);

    const tick = () => {
      x = lerp(x, tx, 0.25);
      y = lerp(y, ty, 0.25);
      paint(x, y);
      raf =
        Math.abs(tx - x) + Math.abs(ty - y) > 0.5
          ? requestAnimationFrame(tick)
          : 0;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = host.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      if (root.dataset.lens !== "on") {
        root.dataset.lens = "on";
        x = tx;
        y = ty;
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onLeave = () => {
      root.dataset.lens = "off";
    };

    if (fine && !reduce) {
      host.addEventListener("pointermove", onMove, { passive: true });
      host.addEventListener("pointerleave", onLeave);
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="th-root contents"
      data-lens="off"
      data-full={full}
    >
      <style>{CSS}</style>
      <svg aria-hidden width="0" height="0" className="absolute">
        <filter id="sentinel-thermal" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0"
          />
          <feComponentTransfer>
            <feFuncR type="table" tableValues="0.04 0.22 0.55 0.95 1" />
            <feFuncG type="table" tableValues="0.02 0.04 0.15 0.55 0.9" />
            <feFuncB type="table" tableValues="0.18 0.55 0.65 0.15 0.1" />
          </feComponentTransfer>
        </filter>
      </svg>

      {/* Satélite que cruza el hero: decorativo y rotulado como ejemplo. */}
      <div
        aria-hidden
        className="th-orbit pointer-events-none absolute inset-0 z-[5] overflow-hidden"
      >
        <div className="th-ox">
          <div className="th-oy flex items-center">
            <span className="h-px w-24 bg-gradient-to-r from-transparent to-white/70 sm:w-32" />
            <span className="size-2.5 rounded-full bg-white shadow-[0_0_14px_3px_rgb(255_255_255/0.6)]" />
            <span className="glass t-label ml-3 hidden sm:inline-block whitespace-nowrap rounded-full px-3 py-1 text-[#f4efe2]">
              Pasada VIIRS · ejemplo
            </span>
          </div>
        </div>
      </div>

      {/* Capa térmica: misma imagen y mismo encuadre que la base, bajo el texto y sobre los scrims. */}
      <div
        aria-hidden
        className="th-layer pointer-events-none absolute inset-0 overflow-hidden"
        style={{ zIndex: -15 }}
      >
        <div className="absolute inset-0 [transform:translateZ(0)]">
          <Image
            src="/hero-forest.avif"
            alt=""
            fill
            sizes="100vw"
            loading="eager"
            className="-scale-x-100 object-cover"
            style={{ filter: THERMAL_FILTER }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/40 via-charcoal/20 to-charcoal/50 lg:bg-gradient-to-r lg:from-charcoal/55 lg:via-charcoal/15 lg:to-transparent" />
        <span
          ref={hotRef}
          className="th-hot absolute size-28 mix-blend-screen sm:size-36"
          style={{ left: "var(--hx)", top: "var(--hy)" }}
        />
        <span
          className="t-label absolute -translate-x-1/2 rounded bg-charcoal/75 px-2 py-0.5 text-[#f4efe2]"
          style={{ left: "var(--hx)", top: "calc(var(--hy) + 4rem)" }}
        >
          Ejemplo ilustrativo
        </span>
      </div>

      {/* Instrumento: retícula, coordenadas y temperatura simulada que acompañan la lente. */}
      <div
        aria-hidden
        className="th-annot pointer-events-none absolute z-[11]"
        style={{
          left: "var(--lx)",
          top: "var(--ly)",
          width: "calc(var(--rr) * 2)",
          height: "calc(var(--rr) * 2)",
          transform: "translate(-50%, -50%)",
        }}
      >
        <span className="absolute inset-0 rounded-full border border-white/55 shadow-[0_0_0_1px_rgb(0_0_0/0.25)]" />
        <span className="absolute inset-x-[18%] top-1/2 h-px bg-white/50" />
        <span className="absolute inset-y-[18%] left-1/2 w-px bg-white/50" />
        <span className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80" />
        <span className="t-label absolute left-[85%] top-[85%] flex flex-col whitespace-nowrap rounded bg-charcoal/80 px-2 py-1 text-[#f4efe2]">
          <span ref={coordRef}>S 41.200° O 71.300°</span>
          <span>
            T <span ref={tempRef}>≈ 12 °C</span> · ejemplo
          </span>
        </span>
      </div>

      <div className="absolute right-5 top-[4.5rem] z-20 flex flex-col items-end gap-2 md:right-8 md:top-24">
        <button
          type="button"
          aria-pressed={full}
          aria-describedby="th-desc"
          onClick={() => setFull((f) => !f)}
          className="glass inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-[#f4efe2] transition-colors hover:border-[#f4efe2]/60 aria-pressed:border-ember/70 aria-pressed:bg-ember/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Thermometer className="size-4" aria-hidden />
          Visión térmica
        </button>
        <p id="th-desc" className="sr-only">
          Muestra la imagen con colores térmicos. Es una vista ilustrativa, no
          son datos reales.
        </p>
        {full && (
          <p className="t-label rounded bg-charcoal/75 px-2 py-1 text-[#f4efe2]">
            Vista ilustrativa · no son datos en vivo
          </p>
        )}
      </div>
    </div>
  );
}
