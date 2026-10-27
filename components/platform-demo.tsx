"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { CLAIMS } from "@/lib/claims";

const PIN_QUERY =
  "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";
const SCROLL_LENGTH = "+=320%";
const SMOOTHING = 0.14;
// Duración real de los videos; se reemplaza por video.duration al cargar metadatos.
const DURATION_A = 16.8;
const DURATION_B = 14.7;

const CAPTION =
  "Reconstrucción del incendio de Puerto Patriada (enero de 2026) en el panel de Sentinel con datos de NASA FIRMS y Sentinel-2.";

type Shot = "general" | "caso";

// Zoom sobre la captura de 3200×2000: origen del recorte en % y escala.
const STEPS: {
  title: string;
  text: string;
  shot: Shot;
  alt: string;
  zoom: { scale: number; origin: string };
}[] = [
  {
    title: "Detectar",
    text: "Leemos los focos de calor que ven los satélites (VIIRS y MODIS vía NASA FIRMS; GOES-19 como alerta temprana).",
    shot: "general",
    alt: "Panel de Sentinel con las capas de detección: anomalías térmicas, alerta temprana y mapa de calor",
    zoom: { scale: 1, origin: "50% 50%" },
  },
  {
    title: "Verificar",
    text: "Cruzamos las fuentes y descartamos calor industrial.",
    shot: "general",
    alt: "Barra de estado del panel con focos de las últimas 24 horas y calor industrial oculto",
    zoom: { scale: 2.1, origin: "30% 0%" },
  },
  {
    title: "Contextualizar",
    text: "Sumamos relieve, viento y localidad.",
    shot: "caso",
    alt: "Reconstrucción del incendio de Puerto Patriada sobre el relieve, con las localidades cercanas",
    zoom: { scale: 1, origin: "50% 50%" },
  },
  {
    title: "Alertar",
    text: `Avisamos por WhatsApp con ubicación y acceso. Objetivo: ${CLAIMS.detectionMinutes} minutos desde la detección (todavía no medido en un incendio real).`,
    shot: "caso",
    alt: "Ficha del caso con superficie, potencia, clima y viento en el momento del foco",
    zoom: { scale: 2.1, origin: "100% 45%" },
  },
];

function Capture({
  shot,
  alt,
  className,
  style,
}: {
  shot: Shot;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const base = `/product/hd-${shot}`;
  return (
    <picture>
      <source
        srcSet={`${base}-1280.avif 1280w, ${base}.avif 3200w`}
        sizes="(min-width: 1024px) 1100px, 100vw"
        type="image/avif"
      />
      <img
        src={`${base}.webp`}
        srcSet={`${base}-1280.webp 1280w, ${base}.webp 3200w`}
        sizes="(min-width: 1024px) 1100px, 100vw"
        alt={alt}
        width={3200}
        height={2000}
        loading="lazy"
        decoding="async"
        draggable={false}
        className={className}
        style={style}
      />
    </picture>
  );
}

function Stacked() {
  return (
    <div>
      <ol className="space-y-20">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <p className="text-sm tabular-nums text-[#4b5750]" aria-hidden>
              0{i + 1}
            </p>
            <h3 className="a-title mt-2 text-[#131a16]">{s.title}</h3>
            <p className="a-sub mt-3 max-w-xl">{s.text}</p>
            <div className="a-brackets mt-6">
              <span className="a-bk a-bk-tr" aria-hidden />
              <span className="a-bk a-bk-bl" aria-hidden />
              <div className="a-frame relative aspect-[16/10]">
                <Capture
                  shot={s.shot}
                  alt={s.alt}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{
                    transform: `scale(${s.zoom.scale})`,
                    transformOrigin: s.zoom.origin,
                  }}
                />
              </div>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-10 max-w-xl text-xs leading-relaxed text-[#4b5750]">
        {CAPTION}
      </p>
    </div>
  );
}

const clamp = (n: number) => Math.min(1, Math.max(0, n));

function VideoLayer({
  videoRef,
  shot,
  name,
  poster,
  alt,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  shot: Shot;
  name: string;
  poster: string;
  alt: string;
}) {
  return (
    <div data-layer={name} className="absolute inset-0">
      <Capture shot={shot} alt={alt} className="h-full w-full object-cover" />
      {/* Opacidad 0 hasta que haya un cuadro decodificado: si falla, queda la captura. */}
      <video
        ref={videoRef}
        muted
        playsInline
        preload="none"
        poster={poster}
        aria-hidden
        tabIndex={-1}
        className="absolute inset-0 h-full w-full object-cover opacity-0"
      >
        <source src={`/video/${name}.mp4`} type="video/mp4" />
      </video>
    </div>
  );
}

function Pinned() {
  const stage = useRef<HTMLDivElement>(null);
  const videoA = useRef<HTMLVideoElement>(null);
  const videoB = useRef<HTMLVideoElement>(null);
  const layerB = useRef<HTMLDivElement>(null);
  const steps = useRef<(HTMLLIElement | null)[]>([]);
  const bar = useRef<HTMLSpanElement>(null);

  // Layout effect: el cleanup debe revertir el pin antes de que React quite el nodo.
  useLayoutEffect(() => {
    const el = stage.current;
    const a = videoA.current;
    const b = videoB.current;
    if (!el || !a || !b) return;
    let cancelled = false;
    let teardown = () => {};

    const onReady = (v: HTMLVideoElement) => () => {
      v.style.opacity = "1";
    };
    const readyA = onReady(a);
    const readyB = onReady(b);
    a.addEventListener("loadeddata", readyA);
    b.addEventListener("loadeddata", readyB);

    // Precarga recién cuando la sección se acerca.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        for (const v of [a, b]) {
          v.preload = "auto";
          v.load();
        }
        io.disconnect();
      },
      { rootMargin: "120% 0px" },
    );
    io.observe(el);

    void import("@/lib/gsap").then(({ gsap, ScrollTrigger }) => {
      if (cancelled) return;
      let target = 0;
      let cur = 0;
      let active = -1;
      const ctx = gsap.context(() => {
        ScrollTrigger.create({
          refreshPriority: 2, // después de Problema (arriba) y antes de las secciones fijas de más abajo (su pin-spacer las desplaza)
          trigger: el,
          start: "top top",
          end: SCROLL_LENGTH,
          pin: true,
          onUpdate: (self) => {
            target = self.progress;
          },
        });
      }, el);

      // Un solo ticker: suaviza el progreso y escribe solo transform/opacity y currentTime.
      const tick = () => {
        cur =
          Math.abs(target - cur) < 0.0005
            ? target
            : cur + (target - cur) * SMOOTHING;
        const idx = Math.min(STEPS.length - 1, Math.floor(cur * STEPS.length));
        if (idx !== active) {
          active = idx;
          steps.current.forEach((li, i) =>
            li?.setAttribute("data-active", String(i === idx)),
          );
        }
        if (bar.current) bar.current.style.transform = `scaleY(${cur})`;
        if (layerB.current)
          layerB.current.style.opacity = String(clamp((cur - 0.46) / 0.08));
        const durA = Number.isFinite(a.duration) ? a.duration : DURATION_A;
        const durB = Number.isFinite(b.duration) ? b.duration : DURATION_B;
        const wantA = clamp(cur / 0.5) * durA;
        const wantB = clamp((cur - 0.5) / 0.5) * durB;
        // No pedimos otro seek mientras el anterior no terminó: evita saturar el decodificador.
        if (
          a.readyState >= 2 &&
          !a.seeking &&
          Math.abs(a.currentTime - wantA) > 0.04
        )
          a.currentTime = wantA;
        if (
          b.readyState >= 2 &&
          !b.seeking &&
          Math.abs(b.currentTime - wantB) > 0.04
        )
          b.currentTime = wantB;
      };
      gsap.ticker.add(tick);
      void document.fonts.ready.then(
        () => !cancelled && ScrollTrigger.refresh(),
      );
      teardown = () => {
        gsap.ticker.remove(tick);
        ctx.revert();
      };
    });

    return () => {
      cancelled = true;
      io.disconnect();
      a.removeEventListener("loadeddata", readyA);
      b.removeEventListener("loadeddata", readyB);
      teardown();
    };
  }, []);

  return (
    <div ref={stage} className="flex h-[100svh] items-center py-8">
      <div className="a-forest grid w-full grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] items-center gap-12 rounded-[20px] p-10 xl:p-14">
        <div className="relative pl-6">
          <span
            aria-hidden
            className="absolute bottom-1 left-0 top-1 w-px bg-a-line"
          />
          <span
            ref={bar}
            aria-hidden
            className="absolute bottom-1 left-0 top-1 w-px origin-top bg-a-accent"
            style={{ transform: "scaleY(0)" }}
          />
          <ol className="space-y-9">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                ref={(n) => {
                  steps.current[i] = n;
                }}
                data-active={i === 0}
                className="opacity-60 transition-opacity duration-300 data-[active=true]:opacity-100"
              >
                <h3 className="a-display-m !text-[clamp(2rem,3vw,3rem)] text-white">
                  <span
                    aria-hidden
                    className="mr-3 font-[family-name:var(--font-geist)] text-base tabular-nums text-a-accent"
                  >
                    0{i + 1}
                  </span>
                  {s.title}
                </h3>
                <p className="a-sub mt-2 !text-[clamp(1.0625rem,1.3vw,1.1875rem)]">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <div className="a-brackets before:!border-a-accent after:!border-a-accent [&>.a-bk]:!border-a-accent">
            <span className="a-bk a-bk-tr" aria-hidden />
            <span className="a-bk a-bk-bl" aria-hidden />
            <div className="a-frame relative aspect-video">
              <VideoLayer
                videoRef={videoA}
                shot="general"
                name="admin-caso"
                poster="/video/admin-caso-poster.webp"
                alt="Panel de Sentinel con focos, capas y línea de tiempo"
              />
              <div
                ref={layerB}
                className="absolute inset-0"
                style={{ opacity: 0 }}
              >
                <VideoLayer
                  videoRef={videoB}
                  shot="caso"
                  name="admin-caso3d"
                  poster="/video/admin-caso3d-poster.webp"
                  alt="Caso Puerto Patriada en el panel de Sentinel"
                />
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-a-faint">{CAPTION}</p>
        </div>
      </div>
    </div>
  );
}

export function PlatformDemo() {
  const [pinned, setPinned] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia(PIN_QUERY);
    const sync = () => setPinned(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return pinned ? <Pinned /> : <Stacked />;
}
