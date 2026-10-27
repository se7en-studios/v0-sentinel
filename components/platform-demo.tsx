"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { CLAIMS } from "@/lib/claims";

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

function CropFrame({ crop }: { crop: Crop }) {
  const { src, w, x, y, alt } = crop;
  return (
    <div className="a-brackets">
      <span className="a-bk a-bk-tr" aria-hidden />
      <span className="a-bk a-bk-bl" aria-hidden />
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
    </div>
  );
}

const KEYS: Record<string, number> = {
  ArrowDown: 1,
  ArrowRight: 1,
  ArrowUp: -1,
  ArrowLeft: -1,
};

export function PlatformDemo() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const step = STEPS[active];

  const onKey = (e: React.KeyboardEvent) => {
    const d = KEYS[e.key];
    if (!d) return;
    e.preventDefault();
    const next = (active + d + STEPS.length) % STEPS.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <>
      <div className="mt-14 grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
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
                onClick={() => setActive(i)}
                className={`a-display-m py-1 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#14231c] ${
                  i === active
                    ? "text-[#131a16]"
                    : "text-[#6f7a73] hover:text-[#131a16]"
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
            className="mt-8 max-w-md"
          >
            <p className="text-xs font-medium text-[#4b5750]">
              Paso {active + 1} de {STEPS.length}
            </p>
            <p className="a-sub mt-2 text-[1.0625rem]">{step.text}</p>
          </div>
        </div>
        <div className="min-w-0">
          <CropFrame key={step.title} crop={step.crop} />
        </div>
      </div>

      <h3 className="mt-24 text-xs font-medium uppercase tracking-[0.16em] text-[#4b5750]">
        Así se ve el panel
      </h3>
      <ul
        className="-mx-5 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 md:mx-0 md:px-0"
        aria-label="Capturas del panel"
      >
        {SHOTS.map(({ src, alt, cap }) => (
          <li
            key={src}
            className="w-[85%] shrink-0 snap-center md:w-[calc((100%-2rem)/3)]"
          >
            <div className="a-frame">
              <Image
                src={src}
                alt={alt}
                width={2000}
                height={1250}
                sizes="(min-width: 768px) 360px, 85vw"
                loading="lazy"
                className="h-auto w-full"
              />
            </div>
            <p className="mt-2 text-xs text-[#4b5750]">{cap}</p>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-[#4b5750]">
        Capturas reales del panel con datos de octubre. Los drones y sensores
        figuran como simulación y la propagación prevista es una demo; hoy la
        lectura es satelital.
      </p>
    </>
  );
}
