"use client";

import { useEffect, useRef, useState } from "react";
import { Satellite, Cpu, Zap } from "lucide-react";

const steps = [
  {
    icon: Satellite,
    number: "01",
    title: "Identificación",
    tagline: "Vigilancia permanente desde el satélite",
    description:
      "Datos satelitales (VIIRS, MODIS, GOES-19) y geoespaciales sobre territorios de difícil acceso, con sensores y drones sumándose de forma progresiva.",
    metrics: [
      { label: "Monitoreo", value: "Continuo" },
      { label: "Fuentes", value: "Satelital" },
    ],
    readout: "> procesando pasada satelital...",
  },
  {
    icon: Cpu,
    number: "02",
    title: "Análisis IA",
    tagline: "Inteligencia que no descansa",
    description:
      "Modelos de IA analizan cada pasada satelital, descartan falsos positivos y generan alertas geoespaciales verificadas.",
    metrics: [
      { label: "Precisión objetivo", value: "98%" },
      { label: "Entrada", value: "Satelital" },
    ],
    readout: "> foco candidato: verificando...",
  },
  {
    icon: Zap,
    number: "03",
    title: "Respuesta",
    tagline: "De la detección a la acción",
    description:
      "Brigadistas, municipios y organismos provinciales reciben alertas con la ubicación aproximada del foco, para decidir y actuar antes.",
    metrics: [
      { label: "Detección objetivo", value: "<8 min" },
      { label: "Destinatarios", value: "Brigadas" },
    ],
    readout: "> alerta enviada -> brigada zona norte",
  },
];

const STEP_DURATION = 3200;

export function HowItWorks() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  // ponytail: starts false to match SSR (no `document` on the server) —
  // syncing the real value happens in the effect below, after hydration,
  // instead of in the initializer, which caused a hydration mismatch for
  // anyone who opened the page in a background tab.
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
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

  // Pause the auto-advance while the tab is backgrounded, so it doesn't burn
  // cycles or jump several steps ahead when the user comes back.
  // ponytail: doesn't also pause on scroll-out — the observer above never
  // flips isVisible back to false (one-shot reveal trigger), so there's no
  // existing "left viewport" signal to reuse without adding a second observer.
  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => setIsTabHidden(document.hidden);
    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!isVisible || isPaused || isTabHidden || reducedMotion) return;
    const timer = setInterval(() => {
      setActiveStep((s) => (s + 1) % 3);
      setProgressKey((k) => k + 1);
    }, STEP_DURATION);
    return () => clearInterval(timer);
  }, [isVisible, isPaused, isTabHidden, reducedMotion]);

  const selectStep = (i: number) => {
    setActiveStep(i);
    setProgressKey((k) => k + 1);
  };

  return (
    <section
      ref={sectionRef}
      id="servicios"
      className="relative py-20 lg:py-24 overflow-hidden"
      style={{ background: "#faf7f0" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(20,74,52,0.15) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div
          className="mb-20 transition-all duration-700"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(16px)",
          }}
        >
          <p
            className="text-[11px] tracking-[0.3em] uppercase mb-4"
            style={{
              fontFamily: "var(--font-sans)",
              color: "rgba(26,24,18,0.62)",
            }}
          >
            Cómo funciona Sentinel Cloud
          </p>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 800,
              fontSize: "clamp(40px, 6vw, 64px)",
              lineHeight: 0.95,
              color: "rgba(26,24,18,0.92)",
              letterSpacing: "-1px",
            }}
          >
            ¿Cómo <span style={{ color: "var(--green-aa)" }}>lo hacemos?</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-5 gap-10 items-start max-w-5xl mx-auto">
          {/* Steps */}
          <div className="relative lg:col-span-3">
            <div
              className="absolute left-[27px] top-8 bottom-8 w-px hidden lg:block"
              style={{ background: "rgba(26,24,18,0.08)" }}
            />

            <div className="space-y-4" role="tablist" aria-label="Pasos de Sentinel Cloud">
              {steps.map((step, i) => {
                const isActive = activeStep === i;
                return (
                  <div
                    key={step.number}
                    id={`hiw-tab-${i}`}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls="hiw-panel"
                    tabIndex={isActive ? 0 : -1}
                    onKeyDown={(e) => {
                      const d =
                        e.key === "ArrowDown" || e.key === "ArrowRight"
                          ? 1
                          : e.key === "ArrowUp" || e.key === "ArrowLeft"
                            ? -1
                            : 0;
                      let n = i;
                      if (d) n = (i + d + steps.length) % steps.length;
                      else if (e.key === "Home") n = 0;
                      else if (e.key === "End") n = steps.length - 1;
                      else if (e.key !== "Enter" && e.key !== " ") return;
                      e.preventDefault();
                      selectStep(n);
                      document.getElementById(`hiw-tab-${n}`)?.focus();
                    }}
                    className="relative flex gap-6 cursor-pointer transition-opacity duration-500 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#0f7a4f] focus-visible:ring-offset-4 focus-visible:ring-offset-[#faf7f0]"
                    style={{
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible
                        ? "translateX(0)"
                        : "translateX(-20px)",
                      transitionDelay: `${i * 140}ms`,
                    }}
                    onClick={() => selectStep(i)}
                  >
                    {/* Step circle */}
                    <div
                      className="relative z-10 flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500"
                      style={{
                        background: isActive
                          ? "rgba(15,122,79,0.12)"
                          : "rgba(26,24,18,0.03)",
                        border: `1.5px solid ${isActive ? "#0f7a4f" : "rgba(26,24,18,0.1)"}`,
                      }}
                    >
                      <step.icon
                        className="w-5 h-5 transition-all duration-300"
                        style={{
                          color: isActive ? "var(--green-aa)" : "rgba(26,24,18,0.62)",
                        }}
                      />
                    </div>

                    {/* Content — plain, no card boundary; the circle +
                        connecting line already read as a timeline, a boxed
                        background around the text was redundant framing. */}
                    <div className="flex-1 pt-3 pb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[10px] tracking-[0.25em] uppercase"
                          style={{
                            fontFamily: "var(--font-sans)",
                            color: isActive ? "var(--green-aa)" : "rgba(26,24,18,0.62)",
                          }}
                        >
                          {step.number}
                        </span>
                      </div>
                      <h3
                        style={{
                          fontFamily: "var(--font-heading)",
                          fontWeight: 800,
                          fontSize: "20px",
                          color: isActive
                            ? "rgba(26,24,18,0.95)"
                            : "rgba(26,24,18,0.62)",
                          transition: "color 0.4s",
                        }}
                      >
                        {step.title}
                      </h3>
                      <p
                        className="text-[11px] mt-0.5"
                        style={{
                          fontFamily: "var(--font-sans)",
                          color: isActive ? "var(--green-aa)" : "rgba(26,24,18,0.68)",
                          transition: "color 0.4s",
                          fontStyle: "italic",
                        }}
                      >
                        {step.tagline}
                      </p>

                      {/* Expandable body */}
                      <div
                        className="overflow-hidden transition-all duration-500"
                        aria-hidden={!isActive}
                        style={{
                          maxHeight: isActive ? "200px" : "0px",
                          opacity: isActive ? 1 : 0,
                        }}
                      >
                        <p
                          className="text-[13px] leading-relaxed mb-4 mt-3"
                          style={{
                            fontFamily: "var(--font-sans)",
                            fontWeight: 300,
                            color: "rgba(26,24,18,0.68)",
                          }}
                        >
                          {step.description}
                        </p>
                        <div className="flex items-center gap-5">
                          {step.metrics.map((m, mi) => (
                            <div
                              key={m.label}
                              className="flex items-center gap-5"
                            >
                              {mi > 0 && (
                                <div
                                  className="w-px h-8"
                                  style={{ background: "rgba(15,122,79,0.15)" }}
                                />
                              )}
                              <div>
                                <div
                                  style={{
                                    fontFamily: "var(--font-heading)",
                                    fontWeight: 700,
                                    fontSize: "16px",
                                    color: "var(--green-aa)",
                                    lineHeight: 1,
                                  }}
                                >
                                  {m.value}
                                </div>
                                <div
                                  className="text-[10px] tracking-wider uppercase mt-0.5"
                                  style={{
                                    fontFamily: "var(--font-sans)",
                                    color: "rgba(26,24,18,0.62)",
                                  }}
                                >
                                  {m.label}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress bar — resets each cycle with progressKey */}
            <div
              className="mt-8 ml-[70px] h-px rounded-full overflow-hidden transition-all duration-700"
              style={{
                background: "rgba(26,24,18,0.06)",
                opacity: isVisible ? 1 : 0,
              }}
            >
              <div
                key={progressKey}
                className="h-full w-full rounded-full"
                style={{
                  background: "#0f7a4f",
                  transformOrigin: "left",
                  // ponytail: pause via the animation shorthand's play-state
                  // (freezes in place) instead of toggling animation-name to
                  // "none" — removing the animation entirely dropped the
                  // inline transform too, so hovering to pause snapped the
                  // bar to full width instead of holding its progress.
                  // Play-state is folded into the shorthand rather than set
                  // via the separate animationPlayState property, since React
                  // warns about mixing a shorthand with its longhand.
                  animation: isVisible
                    ? `progressBar ${STEP_DURATION}ms linear forwards ${
                        isPaused || isTabHidden ? "paused" : "running"
                      }`
                    : "none",
                  transform: isVisible ? undefined : "scaleX(0)",
                }}
              />
            </div>
            <style>{`
            @keyframes progressBar {
              from { transform: scaleX(0); }
              to   { transform: scaleX(1); }
            }
          `}</style>
          </div>

          {/* Visual companion — mirrors whichever step is active instead of
            leaving the right half of the section empty on desktop. */}
          <div
            id="hiw-panel"
            role="tabpanel"
            aria-labelledby={`hiw-tab-${activeStep}`}
            className="hidden lg:flex lg:col-span-2 flex-col items-center justify-center rounded-lg p-10 transition-all duration-700"
            style={{
              background: "#0c0b09",
              border: "0.5px solid rgba(148,241,190,0.15)",
              minHeight: "360px",
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(16px)",
            }}
          >
            {(() => {
              const step = steps[activeStep];
              return (
                <div
                  key={step.number}
                  className="animate-fade-in-up flex flex-col items-center text-center"
                >
                  <div
                    className="relative w-28 h-28 rounded-full flex items-center justify-center mb-6"
                    style={{
                      background: "rgba(148,241,190,0.08)",
                      border: "1px solid rgba(148,241,190,0.3)",
                    }}
                  >
                    <span
                      className="absolute inset-0 rounded-full motion-safe:animate-ping"
                      style={{
                        background: "rgba(148,241,190,0.15)",
                        animationDuration: "2.5s",
                      }}
                    />
                    <step.icon
                      className="relative w-11 h-11"
                      style={{ color: "#94f1be" }}
                    />
                  </div>
                  <p
                    className="text-[11px] tracking-[0.25em] uppercase mb-2"
                    style={{
                      fontFamily: "var(--font-sans)",
                      color: "#94f1be",
                    }}
                  >
                    {step.number} / 03
                  </p>
                  <h3
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontWeight: 800,
                      fontSize: "24px",
                      color: "rgba(240,234,216,0.95)",
                    }}
                  >
                    {step.title}
                  </h3>

                  {/* live readout — reads as the system reporting status
                      for this step, not a static caption */}
                  <div
                    className="mt-5 px-3 py-2 rounded-sm"
                    style={{
                      background: "rgba(148,241,190,0.06)",
                      border: "0.5px solid rgba(148,241,190,0.2)",
                    }}
                  >
                    <span
                      key={step.number}
                      className="animate-typewriter text-[12px]"
                      style={
                        {
                          fontFamily: "var(--font-mono, monospace)",
                          color: "#94f1be",
                          "--typewriter-width": `${step.readout.length}ch`,
                          "--typewriter-steps": step.readout.length,
                        } as React.CSSProperties
                      }
                    >
                      {step.readout}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </section>
  );
}
