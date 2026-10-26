"use client";

import { useEffect, useRef, useState } from "react";
import {
  Thermometer,
  Satellite,
  BellRing,
  LayoutDashboard,
  Radio,
  BarChart3,
} from "lucide-react";

const capabilities = [
  {
    icon: Thermometer,
    title: "Detección térmica con IA",
    description:
      "Datos satelitales y modelos de IA que identifican focos de calor antes de que se conviertan en incendios, con sensores térmicos sumándose de forma progresiva.",
    metrics: [
      { value: "8 min", label: "Detección objetivo" },
      { value: "98%", label: "Precisión objetivo" },
    ],
    grow: 2.4,
    dark: false,
  },
  {
    icon: BellRing,
    title: "Alertas geolocalizadas",
    description: "Ubicación aproximada del foco (píxel satelital) enviada apenas se verifica.",
    grow: 1,
    dark: false,
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard en tiempo real",
    description: "Monitoreo del territorio desde cualquier dispositivo.",
    grow: 1,
    dark: false,
  },
  {
    icon: Radio,
    title: "Integración con brigadas",
    description: "Alertas directas a los equipos de respuesta en campo.",
    grow: 1,
    dark: false,
  },
  {
    icon: BarChart3,
    title: "Reportes y analítica",
    description: "Historial de focos, tiempos de respuesta y tendencias.",
    grow: 1,
    dark: false,
  },
  {
    icon: Satellite,
    title: "Cobertura satelital, con drones en expansión",
    description:
      "Datos satelitales sobre todo el territorio hoy, sumando sensores y drones autónomos de forma progresiva.",
    grow: 1.8,
    dark: true,
  },
];

export function Capabilities() {
  const [isVisible, setIsVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
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
      id="capacidades"
      className="relative py-20 lg:py-24 overflow-hidden"
      style={{ background: "#faf7f0" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 35% 45%, rgba(15,122,79,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
        <div
          className="mb-16 text-center max-w-2xl mx-auto transition-all duration-700"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(16px)",
          }}
        >
          <p
            className="text-[11px] tracking-[0.3em] uppercase mb-5"
            style={{
              fontFamily: "var(--font-sans)",
              color: "rgba(26,24,18,0.62)",
            }}
          >
            La solución a incendios forestales
          </p>
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl mb-3"
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 800,
              color: "rgba(26,24,18,0.92)",
              lineHeight: 1,
            }}
          >
            Todo lo que <span style={{ color: "var(--green-aa)" }}>Sentinel</span> hace
            por vos.
          </h2>
          <p
            className="text-[13px] hidden sm:block"
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 300,
              color: "rgba(26,24,18,0.62)",
            }}
          >
            Pasá el mouse o navegá con el teclado para ver cada capacidad en detalle.
          </p>
        </div>

        {/* Capability flaps: default widths already communicate weight
            (flagship + coverage wider than the rest), hovering any flap
            grows it further and the others yield space. Distinct from the
            bento used before, and from the pipeline/timeline shapes used
            in the sections right above and below this one. */}
        <div className="flex flex-col lg:flex-row gap-3">
          {capabilities.map((cap, i) => {
            const isHovered = hovered === i;
            const growFactor = isHovered ? cap.grow * 1.6 : cap.grow;
            return (
              <div
                key={cap.title}
                tabIndex={0}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered(null)}
                className="group lg:grow-[var(--grow)] relative rounded-lg overflow-hidden min-h-[240px] lg:min-h-0 lg:h-[440px] lg:basis-0 outline-none focus-visible:ring-2 focus-visible:ring-[#0f7a4f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7f0]"
                style={{
                  ["--grow" as string]: growFactor,
                  transition:
                    "flex-grow 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.7s, transform 0.7s",
                  background: cap.dark
                    ? "radial-gradient(circle at 85% 30%, rgba(15,122,79,0.08), transparent 60%), #0c0b09"
                    : "rgba(26,24,18,0.02)",
                  border: cap.dark
                    ? "0.5px solid rgba(15,122,79,0.2)"
                    : "0.5px solid rgba(26,24,18,0.07)",
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateY(0)" : "translateY(24px)",
                  transitionDelay: `${i * 80}ms`,
                }}
              >
                {cap.dark && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage:
                        "radial-gradient(rgba(148,241,190,0.35) 1px, transparent 1px)",
                      backgroundSize: "16px 16px",
                      maskImage:
                        "radial-gradient(ellipse 100% 60% at 50% 100%, black 0%, transparent 70%)",
                      WebkitMaskImage:
                        "radial-gradient(ellipse 100% 60% at 50% 100%, black 0%, transparent 70%)",
                    }}
                  />
                )}

                {!cap.dark && (
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none group-focus-visible:opacity-100"
                    style={{
                      background:
                        "radial-gradient(ellipse at 30% 20%, rgba(15,122,79,0.08), transparent 70%)",
                    }}
                  />
                )}

                {cap.title.includes("térmica") && !reducedMotion && (
                  <div
                    className="absolute -right-10 -bottom-10 w-56 h-56 rounded-full pointer-events-none"
                    style={{ border: "0.5px solid rgba(15,122,79,0.12)" }}
                  >
                    <div
                      className="absolute inset-0 rounded-full animate-spin group-hover:[animation-play-state:paused]"
                      style={{
                        background:
                          "conic-gradient(from 0deg, rgba(15,122,79,0.2), transparent 25%)",
                        animationDuration: "6s",
                      }}
                    />
                  </div>
                )}

                <div className="relative z-10 h-full flex flex-col justify-between p-6">
                  <div className="relative">
                    <div
                      className="relative w-11 h-11 rounded-full flex items-center justify-center mb-5 shrink-0 transition-transform duration-300 group-hover:scale-110 group-focus-visible:scale-110"
                      style={{
                        background: cap.dark
                          ? "rgba(148,241,190,0.1)"
                          : "rgba(15,122,79,0.08)",
                        border: cap.dark
                          ? "0.5px solid rgba(148,241,190,0.3)"
                          : "0.5px solid rgba(15,122,79,0.3)",
                      }}
                    >
                      <cap.icon
                        className="w-5 h-5"
                        style={{ color: cap.dark ? "#94f1be" : "#0f7a4f" }}
                      />
                      {cap.dark && !reducedMotion && (
                        <span
                          className="absolute inline-flex h-2 w-2 rounded-full animate-ping"
                          style={{
                            top: "-2px",
                            right: "-2px",
                            background: "#94f1be",
                          }}
                        />
                      )}
                    </div>

                    <h3
                      className="leading-snug hyphens-auto [overflow-wrap:anywhere]"
                      lang="es"
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontWeight: 800,
                        fontSize: "clamp(15px, 1.35vw, 20px)",
                        color: cap.dark
                          ? "rgba(240,234,216,0.95)"
                          : "rgba(26,24,18,0.92)",
                                              }}
                    >
                      {cap.title}
                    </h3>

                    <p
                      className="text-[13px] leading-relaxed mt-3 overflow-hidden"
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontWeight: 300,
                        color: cap.dark
                          ? "rgba(240,234,216,0.72)"
                          : "rgba(26,24,18,0.68)",
                        maxWidth: "320px",
                      }}
                    >
                      {cap.description}
                    </p>
                  </div>

                  {cap.metrics && (
                    <div className="relative flex gap-6">
                      {cap.metrics.map((m) => (
                        <div key={m.label}>
                          <p
                            style={{
                              fontFamily: "var(--font-heading)",
                              fontWeight: 800,
                              fontSize: "22px",
                              color: "rgba(26,24,18,0.92)",
                            }}
                          >
                            {m.value}
                          </p>
                          <p
                            className="text-[10px] uppercase tracking-wide"
                            style={{
                              fontFamily: "var(--font-sans)",
                              color: "rgba(26,24,18,0.62)",
                            }}
                          >
                            {m.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
