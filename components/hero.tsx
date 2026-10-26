"use client";

import { useEffect, useRef, useState } from "react";
import SmoothScrollHero from "@/components/ui/smooth-scroll-hero";

const stats = [
  { target: 8, suffix: "min", label: "Objetivo de detección" },
  { target: 24, suffix: "h", label: "Monitoreo satelital continuo" },
  { target: 98, suffix: "%", label: "Precisión objetivo" },
];

function useCountUp(target: number, isVisible: boolean, duration = 1800) {
  const [count, setCount] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!isVisible || hasRun.current) return;
    hasRun.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isVisible, target, duration]);

  return count;
}

function AnimatedStat({
  target,
  suffix,
  label,
}: {
  target: number;
  suffix: string;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const count = useCountUp(target, inView);

  return (
    <div ref={ref} className="text-center">
      <div
        className="leading-none font-bold"
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(1.5rem, 3.5vw, 2rem)",
          color: "rgba(240,234,216,0.95)",
        }}
      >
        {count}
        <span style={{ color: "#94f1be" }}> {suffix}</span>
      </div>
      <div
        className="mt-1"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "11px",
          fontWeight: 400,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "rgba(240,234,216,0.85)",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <div id="inicio">
      <SmoothScrollHero
        scrollHeight={450}
        desktopImage="/hero-forest.avif"
        mobileImage="/hero-forest.avif"
        initialClipPercentage={0}
        finalClipPercentage={100}
      >
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium tracking-wider uppercase mb-6"
            style={{
              background: "rgba(12,11,9,0.6)",
              border: "0.5px solid rgba(148,241,190,0.3)",
              backdropFilter: "blur(8px)",
              color: "#94f1be",
              fontFamily: "var(--font-sans)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#94f1be]" />
            Sentinel Cloud · Patagonia
          </div>

          <h1
            className="font-extrabold tracking-[-0.03em] text-4xl sm:text-5xl lg:text-6xl mb-6"
            style={{
              fontFamily: "var(--font-heading)",
              lineHeight: 1.05,
              color: "rgba(240,234,216,0.95)",
            }}
          >
            Detectamos{" "}
            <span style={{ color: "#94f1be" }}>incendios en minutos</span>, no
            en horas
          </h1>

          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 300,
              fontSize: "16px",
              lineHeight: 1.75,
              color: "rgba(240,234,216,0.75)",
            }}
          >
            Sentinel Cloud cruza datos satelitales, información geoespacial e IA
            para vigilar tu territorio y avisar a{" "}
            <strong
              style={{ fontWeight: 500, color: "rgba(240,234,216,0.98)" }}
            >
              municipios, brigadas y grandes propietarios
            </strong>{" "}
            apenas aparece un foco real, con sensores y drones sumándose de
            forma progresiva.
          </p>

          <div className="flex items-center gap-6 sm:gap-10 mt-10">
            {stats.map((s, i) => (
              <div key={s.label} className="flex items-center gap-6 sm:gap-10">
                {i > 0 && (
                  <div
                    className="w-px self-stretch"
                    style={{ background: "rgba(240,234,216,0.15)" }}
                  />
                )}
                <AnimatedStat
                  target={s.target}
                  suffix={s.suffix}
                  label={s.label}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-10">
            <a
              href="#contacto"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-[13px] font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94f1be] bg-[#94f1be] text-[#0c0b09] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 500,
                letterSpacing: "0.04em",
              }}
            >
              Solicitar reunión
            </a>

            <a
              href="#recorrido"
              className="inline-flex items-center justify-center px-7 py-3 rounded-full text-[13px] font-light transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94f1be] border border-[rgba(240,234,216,0.25)] hover:border-[rgba(240,234,216,0.5)]"
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 300,
                color: "rgba(240,234,216,0.85)",
              }}
            >
              Ver el recorrido
            </a>
          </div>
        </div>
      </SmoothScrollHero>
    </div>
  );
}
