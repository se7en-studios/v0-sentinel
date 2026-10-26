"use client";

import { useEffect, useRef, useState } from "react";
import {
  Flame,
  Radar,
  Satellite,
  BellRing,
  Plane,
  Thermometer,
} from "lucide-react";

const flow = [
  { icon: Flame, label: "Detectar" },
  { icon: Radar, label: "Verificar" },
  { icon: Satellite, label: "Contextualizar" },
  { icon: BellRing, label: "Alertar" },
];

const monitoring = [
  {
    icon: Plane,
    text: "Verificación automatizada de cada foco con datos satelitales y contexto geoespacial.",
  },
  {
    icon: Thermometer,
    text: "Sensores y drones en el territorio, sumándose de forma progresiva a la cobertura satelital.",
  },
  {
    icon: Satellite,
    text: "Datos satelitales (VIIRS, MODIS y GOES-19) para contexto de riesgo y mapeo continuo.",
  },
];

export function Features() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.05, rootMargin: "0px 0px 200px 0px" },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="nosotros"
      className="relative py-20 lg:py-24 bg-[#faf7f0] overflow-hidden"
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
        style={{
          opacity: isVisible ? 1 : 0,
          backgroundImage:
            "radial-gradient(ellipse 70% 50% at 65% 55%, rgba(15,122,79,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Subtle grid lines */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ opacity: 0.025 }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px"
            style={{
              left: `${(i + 1) * 12.5}%`,
              background: "rgba(15,122,79,1)",
            }}
          />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 h-px"
            style={{
              top: `${(i + 1) * 16.6}%`,
              background: "rgba(15,122,79,1)",
            }}
          />
        ))}
      </div>

      <div className="relative max-w-4xl mx-auto px-6 lg:px-10 text-center">
        {/* ── HEADER — stacked, no split-header box ── */}
        <p
          className="text-[11px] tracking-[0.3em] uppercase mb-5 transition-all duration-700"
          style={{
            fontFamily: "var(--font-sans)",
            color: "rgba(26,24,18,0.62)",
            opacity: isVisible ? 1 : 0,
          }}
        >
          Sentinel Cloud: inteligencia territorial para incendios forestales
        </p>
        <h2
          className="text-4xl sm:text-5xl lg:text-6xl mb-6 transition-all duration-700"
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 800,
            color: "rgba(26,24,18,0.92)",
            lineHeight: 1,
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(16px)",
            transitionDelay: "100ms",
          }}
        >
          Nuestra <span style={{ color: "var(--green-aa)" }}>solución.</span>
        </h2>
        <p
          className="max-w-2xl mx-auto text-[15px] leading-relaxed transition-all duration-700"
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 300,
            color: "rgba(26,24,18,0.7)",
            opacity: isVisible ? 1 : 0,
            transitionDelay: "200ms",
          }}
        >
          Una plataforma integral que combina datos satelitales, información
          geoespacial e IA, con foco inicial en{" "}
          <span style={{ color: "rgba(26,24,18,0.85)", fontWeight: 400 }}>
            la Patagonia
          </span>
          , sumando sensores y drones de forma progresiva.{" "}
          <span style={{ color: "rgba(26,24,18,0.85)", fontWeight: 400 }}>
            De una acción reactiva a una acción preventiva.
          </span>
        </p>
      </div>

      {/* ── PIPELINE — full width, no card boundary ── */}
      <div className="relative max-w-5xl mx-auto px-6 lg:px-10 mt-16 lg:mt-20">
        <div className="relative flex flex-col sm:flex-row items-start gap-10 sm:gap-2">
          {/* connector */}
          <div
            className="hidden sm:block absolute top-8 pointer-events-none"
            style={{
              left: "32px",
              right: "32px",
              height: "1px",
              background: "rgba(15,122,79,0.18)",
            }}
          >
            <div
              className="absolute top-1/2 w-2.5 h-2.5 rounded-full animate-flow-pulse"
              style={{
                marginTop: "-5px",
                background: "#0f7a4f",
                boxShadow: "0 0 10px rgba(15,122,79,0.6)",
              }}
            />
          </div>

          {flow.map((step, i) => (
            <div
              key={step.label}
              className="relative flex items-center gap-4 sm:flex-col sm:items-center sm:text-center sm:flex-1 transition-all duration-700"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(12px)",
                transitionDelay: `${400 + i * 120}ms`,
              }}
            >
              <div
                className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center shrink-0 sm:mb-4"
                style={{
                  background: "#faf7f0",
                  border: "1px solid rgba(15,122,79,0.3)",
                  boxShadow: "0 4px 16px rgba(15,122,79,0.08)",
                }}
              >
                <step.icon className="w-6 h-6" style={{ color: "var(--green-aa)" }} />
              </div>
              <div>
                <span
                  className="block text-[10px] tracking-[0.2em] uppercase mb-1"
                  style={{
                    fontFamily: "var(--font-sans)",
                    color: "rgba(26,24,18,0.62)",
                  }}
                >
                  0{i + 1}
                </span>
                <p
                  className="text-[15px]"
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontWeight: 700,
                    color: "rgba(26,24,18,0.88)",
                  }}
                >
                  {step.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SUPPORTING FACTS — inline pills, not boxed cards ── */}
      <div className="relative max-w-4xl mx-auto px-6 lg:px-10 mt-16 lg:mt-20">
        <div
          className="flex flex-wrap justify-center gap-3 transition-all duration-700"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(16px)",
            transitionDelay: "900ms",
          }}
        >
          {monitoring.map((item) => (
            <div
              key={item.text}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-full"
              style={{
                background: "rgba(26,24,18,0.03)",
                border: "0.5px solid rgba(26,24,18,0.08)",
              }}
            >
              <item.icon
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: "var(--green-aa)" }}
              />
              <p
                className="text-[12px] leading-snug"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 300,
                  color: "rgba(26,24,18,0.7)",
                }}
              >
                {item.text}
              </p>
            </div>
          ))}
        </div>

        <div
          className="flex justify-center mt-8 transition-all duration-700"
          style={{
            opacity: isVisible ? 1 : 0,
            transitionDelay: "1000ms",
          }}
        >
          <div className="inline-flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse-slow"
              style={{ background: "#0f7a4f" }}
            />
            <span
              className="text-[11px] tracking-wide"
              style={{
                fontFamily: "var(--font-sans)",
                color: "rgba(26,24,18,0.62)",
              }}
            >
              Sentinel Cloud en desarrollo y validación en territorio
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
