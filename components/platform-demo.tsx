"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CLAIMS } from "@/lib/claims";
import { PHOTOS, creditLine } from "@/lib/photos";

// Recorte nítido de una captura: la imagen se agranda a 1/w del ancho del marco
// y se desplaza (x, y) en fracción de la propia imagen. Las capturas son 16:10 y
// el marco también, así que el alto del recorte es igual a w.
type Crop = { src: string; w: number; x: number; y: number; alt: string };

const STEPS: { title: string; text: string; crop: Crop }[] = [
  {
    title: "Detectar",
    text: "Leemos las anomalías térmicas de VIIRS y MODIS vía NASA FIRMS, y usamos GOES-19 como alerta temprana entre pasada y pasada.",
    crop: {
      src: "/product/panel-2d.webp",
      w: 0.245,
      x: 0.752,
      y: 0.405,
      alt: "Capas de detección del panel: anomalías térmicas NASA, alerta temprana GOES, mapa de calor y propagación prevista",
    },
  },
  {
    title: "Verificar",
    text: "Cruzamos las fuentes y separamos el calor industrial, así una chimenea o una quema autorizada no dispara la alarma de todos.",
    crop: {
      src: "/product/panel-2d.webp",
      w: 0.36,
      x: 0.33,
      y: 0.04,
      alt: "Barra de estado del panel con alerta temprana GOES, focos de las últimas 24 horas y calor industrial oculto",
    },
  },
  {
    title: "Contextualizar",
    text: "Ponemos el foco sobre el relieve, la localidad más cercana y el viento, para que se vea hacia dónde puede ir y por dónde se llega.",
    crop: {
      src: "/product/panel-3d.webp",
      w: 0.4,
      x: 0.3,
      y: 0.2,
      alt: "Terreno en 3D del panel sobre la zona de Río Villegas y El Foyel",
    },
  },
  {
    title: "Alertar",
    text: `Mandamos el aviso por WhatsApp con ubicación, viento y acceso. Nuestro objetivo es hacerlo dentro de ${CLAIMS.detectionMinutes} minutos de la detección.`,
    crop: {
      src: "/product/panel-2d.webp",
      w: 0.2,
      x: 0.56,
      y: 0.8,
      alt: "Línea de tiempo del panel con el botón En vivo y los eventos clave del período",
    },
  },
];

const SHOTS = [
  {
    src: "/product/panel-2d.webp",
    alt: "Panel de Sentinel en vista 2D sobre la Patagonia Andina, con capas de detección a la derecha",
    cap: "Vista 2D",
  },
  {
    src: "/product/panel-3d.webp",
    alt: "Panel de Sentinel en vista 3D con terreno y bosque en volumen",
    cap: "Vista 3D",
  },
  {
    src: "/product/panel-3d-hero.webp",
    alt: "Vista 3D del panel de Sentinel sobre un valle",
    cap: "Terreno",
  },
];

function CropImg({ crop }: { crop: Crop }) {
  const { src, w, x, y, alt } = crop;
  return (
    <div className="a-frame relative aspect-[16/10]">
      <Image
        src={src}
        alt={alt}
        width={2000}
        height={1250}
        unoptimized
        loading="lazy"
        draggable={false}
        className="absolute left-0 top-0 h-auto max-w-none"
        style={{
          width: `${100 / w}%`,
          transform: `translate(${-x * 100}%, ${-y * 100}%)`,
        }}
      />
    </div>
  );
}

// Las 4 capturas apiladas: la activa entra con crossfade y zoom suave (solo opacity/transform).
function CropStack({ active }: { active: number }) {
  return (
    <div className="a-brackets">
      <span className="a-bk a-bk-tr" aria-hidden />
      <span className="a-bk a-bk-bl" aria-hidden />
      <div className="relative aspect-[16/10]">
        {STEPS.map(({ title, crop }, i) => (
          <div
            key={title}
            aria-hidden={i !== active}
            className={`absolute inset-0 transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none ${
              i === active ? "scale-100 opacity-100" : "scale-[1.04] opacity-0"
            }`}
          >
            <CropImg crop={crop} />
          </div>
        ))}
      </div>
    </div>
  );
}

const SPACE = [PHOTOS.satChubut, PHOTOS.satAlerces, PHOTOS.satNasa];

const KEYS: Record<string, number> = {
  ArrowDown: 1,
  ArrowRight: 1,
  ArrowUp: -1,
  ArrowLeft: -1,
};

const STICKY_QUERY =
  "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";
const LOCK_MS = 900;

export function PlatformDemo() {
  const [active, setActive] = useState(0);
  const [sticky, setSticky] = useState(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const outer = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const lockUntil = useRef(0);
  const step = STEPS[active];

  useEffect(() => {
    const mq = window.matchMedia(STICKY_QUERY);
    const sync = () => setSticky(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Un único rAF escribe --p y calcula el paso; solo escucha con la sección en pantalla.
  useEffect(() => {
    const el = outer.current;
    if (!sticky || !el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      if (total <= 0) return;
      const p = Math.min(1, Math.max(0, -r.top / total));
      el.style.setProperty("--p", p.toFixed(4));
      if (performance.now() < lockUntil.current) return;
      const idx = Math.min(STEPS.length - 1, Math.floor(p * STEPS.length));
      if (idx !== activeRef.current) {
        activeRef.current = idx;
        setActive(idx);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        onScroll();
      } else {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [sticky]);

  const goTo = useCallback(
    (i: number, focus = false) => {
      activeRef.current = i;
      setActive(i);
      if (focus) tabs.current[i]?.focus();
      const el = outer.current;
      if (!sticky || !el) return;
      const total = el.offsetHeight - window.innerHeight;
      const top = window.scrollY + el.getBoundingClientRect().top;
      lockUntil.current = performance.now() + LOCK_MS;
      window.scrollTo({
        top: top + ((i + 0.5) / STEPS.length) * total,
        behavior: "smooth",
      });
    },
    [sticky],
  );

  const onKey = (e: React.KeyboardEvent) => {
    const d = KEYS[e.key];
    if (!d) return;
    e.preventDefault();
    goTo((active + d + STEPS.length) % STEPS.length, true);
  };

  const layout = (
    <div
      className={`grid w-full grid-cols-1 items-center gap-10 md:gap-16 ${
        sticky ? "md:grid-cols-[0.8fr_1.2fr]" : "mt-14 md:grid-cols-2"
      }`}
    >
      <div className="min-w-0">
        <div
          role="tablist"
          aria-label="Pasos de Sentinel"
          aria-orientation="vertical"
          onKeyDown={onKey}
          className="flex flex-col items-start"
        >
          {STEPS.map(({ title }, i) => (
            <button
              key={title}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              id={`pd-tab-${i}`}
              role="tab"
              type="button"
              aria-selected={i === active}
              aria-controls="pd-panel"
              tabIndex={i === active ? 0 : -1}
              onClick={() => goTo(i)}
              className={`a-display-m py-1 text-left transition-colors duration-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#14231c] ${
                i === active
                  ? "text-[#131a16]"
                  : "text-[#66706a] hover:text-[#131a16]"
              }`}
            >
              {title}
            </button>
          ))}
        </div>
        <div
          id="pd-panel"
          role="tabpanel"
          aria-labelledby={`pd-tab-${active}`}
          className="mt-8 min-h-[9rem] max-w-md"
        >
          <p className="text-xs font-medium text-[#4b5750]">
            Paso {active + 1} de {STEPS.length}
          </p>
          <p
            key={active}
            className="a-sub mt-2 text-[1.0625rem] [animation:pd-in_0.5s_ease-out] motion-reduce:animate-none"
          >
            {step.text}
          </p>
        </div>
        {sticky && (
          <div
            className="mt-4 h-px w-full max-w-md bg-[#131a16]/15"
            aria-hidden
          >
            <div
              className="h-full origin-left bg-[#131a16]"
              style={{ transform: "scaleX(var(--p, 0))" }}
            />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <CropStack active={active} />
      </div>
    </div>
  );

  return (
    <>
      <style>{`@keyframes pd-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
      {sticky ? (
        <div ref={outer} className="h-[360svh]">
          <div className="sticky top-0 flex h-svh items-center">{layout}</div>
        </div>
      ) : (
        layout
      )}

      <h3 className="mt-24 text-xs font-medium uppercase tracking-[0.16em] text-[#4b5750]">
        Así se ve el panel
      </h3>
      <div
        className="a-marquee -mx-5 mt-6 overflow-hidden motion-reduce:overflow-x-auto md:-mx-8"
        role="group"
        aria-label="Capturas del panel"
      >
        <div className="a-marquee-track" style={{ ["--dur" as string]: "50s" }}>
          {[false, true].map((dup) => (
            <ul
              key={String(dup)}
              aria-hidden={dup || undefined}
              className="flex shrink-0 gap-4 pr-4 motion-reduce:last:hidden"
            >
              {[...SHOTS, ...SHOTS].map(({ src, alt, cap }, i) => (
                <li
                  key={`${src}-${i}`}
                  className="w-[78vw] shrink-0 md:w-[380px]"
                >
                  <div className="a-frame">
                    <Image
                      src={src}
                      alt={dup || i >= SHOTS.length ? "" : alt}
                      width={2000}
                      height={1250}
                      sizes="(min-width: 768px) 380px, 78vw"
                      loading="lazy"
                      className="h-auto w-full"
                    />
                  </div>
                  <p className="mt-2 text-xs text-[#4b5750]">{cap}</p>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      <p className="mt-4 text-xs text-[#4b5750]">
        Capturas reales del panel con datos de octubre. Los drones y sensores
        figuran como simulación y la propagación prevista es una demo; hoy la
        lectura es satelital.
      </p>

      <h3 className="mt-24 text-xs font-medium uppercase tracking-[0.16em] text-[#4b5750]">
        Lo que se ve desde el espacio
      </h3>
      <p className="a-sub mt-3 max-w-2xl">
        Son imágenes Sentinel-2 del programa Copernicus de los incendios de
        Chubut y de Los Alerces: se ven las cicatrices de quema y las columnas
        de humo. Ilustran lo que se ve desde órbita; el producto usa lecturas
        térmicas VIIRS, MODIS y GOES-19, no estas imágenes.
      </p>
      <ul
        aria-label="Imágenes satelitales de incendios en la Patagonia"
        className="-mx-5 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0"
      >
        {SPACE.map((p) => (
          <li key={p.src} className="w-[82%] shrink-0 snap-start md:w-auto">
            <div className="a-brackets">
              <span className="a-bk a-bk-tr" aria-hidden />
              <span className="a-bk a-bk-bl" aria-hidden />
              <div className="a-wipe relative aspect-[4/3] overflow-hidden">
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  sizes="(min-width: 1100px) 360px, (min-width: 768px) 33vw, 82vw"
                  loading="lazy"
                  className="object-cover"
                  style={{ objectPosition: p.position }}
                />
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#4b5750]">
              {p.caption}
              <span className="block">{creditLine(p)}</span>
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
