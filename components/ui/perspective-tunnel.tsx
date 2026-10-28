"use client";

import Image from "next/image";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

export type TunnelItem = { src: string; title: string; alt: string };

type CardData = {
  item: TunnelItem;
  angleCos: number;
  angleSin: number;
  radiusFactorX: number;
  radiusFactorY: number;
  rotationZ: number;
  index: number;
};

// Ángulo áureo: las tarjetas se reparten alrededor del eje sin amontonarse.
function buildCards(items: TunnelItem[]): CardData[] {
  return items.map((item, i) => {
    const a = i * 137.5 * (Math.PI / 180);
    return {
      item,
      angleCos: Math.cos(a),
      angleSin: Math.sin(a),
      radiusFactorX: 0.28 + (i % 3) * 0.08,
      radiusFactorY: 0.26 + (i % 2) * 0.09,
      rotationZ: (i % 2 === 0 ? 1 : -1) * (3 + (i % 5) * 2),
      index: i,
    };
  });
}

const SPRING = { stiffness: 60, damping: 25, mass: 0.5 };

type Stage = { width: number; height: number; isMobile: boolean };

function useCameraParallax(enabled: boolean) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING);
  const y = useSpring(rawY, SPRING);
  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: PointerEvent) => {
      rawX.set((e.clientX / window.innerWidth - 0.5) * 2);
      rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled, rawX, rawY]);
  return { x, y };
}

function TunnelCard({
  card,
  progress,
  pointer,
  total,
  stage,
}: {
  card: CardData;
  progress: MotionValue<number>;
  pointer: { x: MotionValue<number>; y: MotionValue<number> };
  total: number;
  stage: Stage;
}) {
  const span = 0.55;
  const start = (card.index / total) * (1 - span);
  const local = useTransform(progress, [start, start + span], [0, 1]);

  const z = useTransform(
    local,
    [0, 1],
    [stage.isMobile ? -1200 : -1700, stage.isMobile ? 350 : 500],
  );
  // En celular la tarjeta se apaga antes de cruzar el plano del título (z=0, local≈0.77) para no taparlo.
  const opacity = useTransform(
    local,
    stage.isMobile ? [0, 0.18, 0.6, 0.74] : [0, 0.18, 0.82, 0.98],
    [0, 1, 1, 0],
  );

  const width = stage.isMobile
    ? Math.max(130, Math.min(180, stage.width * 0.38))
    : Math.max(180, Math.min(270, stage.width * 0.18));
  const baseX = card.angleCos * (stage.width * card.radiusFactorX);
  const baseY = card.angleSin * (stage.height * card.radiusFactorY);
  const pan = stage.isMobile ? 20 : 45;

  const transform = useTransform(
    [z, pointer.x, pointer.y],
    ([cz, px, py]: number[]) => {
      return `translate3d(calc(-50% + ${baseX - px * pan}px), calc(-50% + ${baseY - py * pan}px), ${cz}px) rotateZ(${card.rotationZ}deg)`;
    },
  );

  return (
    <motion.figure
      style={{ width, transform, opacity, zIndex: card.index + 1 }}
      className="absolute left-1/2 top-1/2 m-0 aspect-[4/5] select-none will-change-transform"
    >
      <div className="group relative h-full w-full overflow-hidden rounded-2xl bg-[#14231c] shadow-2xl shadow-black/80 ring-1 ring-white/15">
        <Image
          src={card.item.src}
          alt={card.item.alt}
          fill
          sizes="270px"
          draggable={false}
          className="object-cover"
        />
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/10 to-transparent p-4">
          <figcaption className="text-[0.8125rem] font-medium uppercase tracking-[0.18em] text-white/95 drop-shadow">
            {card.item.title}
          </figcaption>
        </div>
      </div>
    </motion.figure>
  );
}

// Túnel de fotos: la sección queda fija y el scroll de la página recorre el corredor.
// (El original capturaba la rueda del mouse; acá se usa el scroll normal para no bloquear la página.)
export function PerspectiveTunnel({
  items,
  eyebrow,
  title,
  hint,
  children,
}: {
  items: TunnelItem[];
  eyebrow: string;
  title: ReactNode;
  hint: string;
  children?: ReactNode;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [stage, setStage] = useState<Stage>({
    width: 1440,
    height: 900,
    isMobile: false,
  });

  useEffect(() => {
    const update = () =>
      setStage({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth < 768,
      });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 30,
    restDelta: 0.0001,
  });
  const pointer = useCameraParallax(!reduce);

  const titleScale = useTransform(progress, [0, 0.5, 1], [0.7, 1, 1.35]);
  const titleOpacity = useTransform(
    progress,
    [0, 0.12, 0.85, 1],
    [0.25, 1, 1, 0],
  );
  const hintOpacity = useTransform(progress, [0, 0.12], [1, 0]);

  const cards = buildCards(items);

  // Con movimiento reducido: una grilla simple, sin túnel ni sección alta.
  if (reduce) {
    return (
      <section className="a-root px-5 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-5xl text-center">
          <p className="a-eyebrow">{eyebrow}</p>
          <h2 className="a-display mt-4">{title}</h2>
        </div>
        <ul className="mx-auto mt-14 grid max-w-6xl grid-cols-2 gap-4 md:grid-cols-3">
          {items.map((it) => (
            <li
              key={it.src}
              className="relative aspect-[4/5] overflow-hidden rounded-2xl"
            >
              <Image
                src={it.src}
                alt={it.alt}
                fill
                sizes="(min-width: 768px) 33vw, 50vw"
                className="object-cover"
              />
            </li>
          ))}
        </ul>
        {children}
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="a-root relative h-[320svh]"
      aria-label={eyebrow}
    >
      <div
        className="sticky top-0 flex h-[100svh] w-full items-center justify-center overflow-hidden bg-a-bg"
        style={{
          perspective: stage.isMobile ? "900px" : "1200px",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Fondo: grilla de puntos y resplandor de brasa */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgb(169_239_201/0.14)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_60%,transparent_100%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,106,43,0.16)_0%,transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute h-[48vmin] w-[48vmin] rounded-full border border-[#a9efc9]/15"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute h-[76vmin] w-[76vmin] rounded-full border border-dashed border-white/10"
        />

        <motion.div
          style={{ scale: titleScale, opacity: titleOpacity }}
          className="pointer-events-none relative z-30 flex max-w-3xl flex-col items-center px-6 text-center [text-shadow:0_2px_18px_rgba(0,0,0,0.85)]"
        >
          <p className="a-eyebrow">{eyebrow}</p>
          <h2 className="a-display mt-4 !text-[clamp(3rem,8.5vw,7.5rem)] !leading-[0.92]">
            {title}
          </h2>
        </motion.div>

        <motion.div
          style={{ opacity: hintOpacity }}
          className="pointer-events-none absolute bottom-8 z-20 flex flex-col items-center gap-2 text-[0.8125rem] uppercase tracking-[0.28em] text-a-mute"
        >
          <span>{hint}</span>
          <div
            aria-hidden
            className="h-6 w-px bg-gradient-to-b from-a-accent to-transparent"
          />
        </motion.div>

        <div
          className="pointer-events-none absolute inset-0"
          style={{ transformStyle: "preserve-3d" }}
        >
          {cards.map((c) => (
            <TunnelCard
              key={c.item.src}
              card={c}
              progress={progress}
              pointer={pointer}
              total={cards.length}
              stage={stage}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
