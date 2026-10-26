"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Satellite, Cpu, Zap, Radio, BellRing, CheckCircle2, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Satellite,
    number: "01",
    title: "Identificación",
    tagline: "Vigilancia permanente desde el espacio",
    description:
      "Datos satelitales (VIIRS, MODIS, GOES-19) y capas geoespaciales sobre territorios remotos, con sensores y drones sumándose progresivamente.",
    metrics: [
      { label: "Monitoreo", value: "24/7" },
      { label: "Fuentes", value: "Constelación LEO/GEO" },
    ],
    readout: "> pasadas satelitales procesadas en tiempo real",
    telemetry: {
      source: "VIIRS-SNPP & GOES-19 EAST",
      coverage: "Andes Patagónicos",
      status: "ESCANEANDO ANOMALÍAS TÉRMICAS",
    },
  },
  {
    icon: Cpu,
    number: "02",
    title: "Análisis IA",
    tagline: "Inteligencia artificial que no descansa",
    description:
      "Modelos de visión neuronal analizan cada píxel térmico, descartan chimeneas, reflejos y nubes para clasificar el riesgo en segundos.",
    metrics: [
      { label: "Precisión objetivo", value: "98%" },
      { label: "Tiempo de inferencia", value: "<1.2s" },
    ],
    readout: "> foco candidato verificado: sin falsos positivos",
    telemetry: {
      source: "Red Neuronal Sentinel-V2",
      coverage: "Filtro de Falsos Positivos",
      status: "CONFIRMACIÓN TÉRMICA POSITIVA",
    },
  },
  {
    icon: Zap,
    number: "03",
    title: "Respuesta",
    tagline: "De la detección satelital a la acción en campo",
    description:
      "Brigadistas, defensas civiles y municipios reciben la alerta geolocalizada con radio de propagación estimada para intervenir a tiempo.",
    metrics: [
      { label: "Detección objetivo", value: "<8 min" },
      { label: "Canales", value: "WhatsApp / App / API" },
    ],
    readout: "> alerta despachada -> brigada local en alerta",
    telemetry: {
      source: "Dispatcher Multi-Canal",
      coverage: "Cuadrante Bariloche - El Bolsón",
      status: "BRIGADA NOTIFICADA CON ÉXITO",
    },
  },
];

const STEP_DURATION = 4200;

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
      setProgressKey((k) => k + 1);
    }, STEP_DURATION);
    return () => clearInterval(timer);
  }, [isPaused]);

  const selectStep = (i: number) => {
    setActiveStep(i);
    setProgressKey((k) => k + 1);
  };

  const currentStep = steps[activeStep];
  const StepIcon = currentStep.icon;

  return (
    <section
      id="servicios"
      className="relative py-24 lg:py-32 bg-[#faf7f0] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background radial ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(20,74,52,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-10">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase mb-4 bg-emerald-900/10 text-emerald-800 border border-emerald-700/20">
            <Radio className="w-3.5 h-3.5 text-emerald-700" />
            <span>Flujo Operativo de Sentinel</span>
          </div>

          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1a1812]"
            style={{ fontFamily: "var(--font-heading)", lineHeight: 1.05 }}
          >
            ¿Cómo <span className="text-[var(--green-aa)]">lo hacemos?</span>
          </h2>
          
          <p
            className="mt-4 text-[15px] sm:text-[16px] text-[#1a1812]/70 font-light max-w-xl mx-auto"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Del espacio al territorio en menos de 8 minutos: una cadena coordinada de telemetría y respuesta rápida.
          </p>
        </motion.div>

        {/* 2-Column Interactive Workspace */}
        <div className="grid lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
          
          {/* Left Column: Interactive Steps Timeline */}
          <div className="lg:col-span-7 space-y-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isActive = activeStep === i;

              return (
                <div
                  key={step.number}
                  onClick={() => selectStep(i)}
                  className={`cursor-pointer rounded-2xl p-6 transition-all duration-300 border ${
                    isActive
                      ? "bg-white border-emerald-600/40 shadow-xl shadow-emerald-900/10 scale-[1.01]"
                      : "bg-white/50 border-black/5 hover:bg-white hover:border-black/10"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                        isActive
                          ? "bg-emerald-900 text-emerald-300 shadow-md shadow-emerald-900/20 scale-105"
                          : "bg-emerald-50 text-emerald-800"
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono tracking-wider uppercase text-emerald-800 font-semibold">
                          PASO {step.number}
                        </span>
                        {isActive && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                          </span>
                        )}
                      </div>

                      <h3
                        className="text-lg font-bold text-[#1a1812]"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        {step.title}
                      </h3>
                      
                      <p className="text-[12px] font-medium text-emerald-800 mb-2 italic">
                        {step.tagline}
                      </p>

                      <p className="text-[13px] text-[#1a1812]/75 font-light leading-relaxed">
                        {step.description}
                      </p>

                      {/* Expandable metrics on active */}
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          transition={{ duration: 0.3 }}
                          className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-black/5 text-xs font-mono"
                        >
                          {step.metrics.map((m) => (
                            <div key={m.label} className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-600/10">
                              <span className="text-[10px] text-emerald-900/60 uppercase block">{m.label}</span>
                              <span className="text-emerald-900 font-bold text-[13px]">{m.value}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Active Progress Bar */}
                  {isActive && (
                    <div className="mt-4 h-1 rounded-full bg-emerald-100 overflow-hidden">
                      <motion.div
                        key={progressKey}
                        initial={{ width: "0%" }}
                        animate={{ width: isPaused ? "100%" : "100%" }}
                        transition={{
                          duration: STEP_DURATION / 1000,
                          ease: "linear",
                        }}
                        className="h-full bg-gradient-to-r from-emerald-600 to-[#94f1be]"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column: High-Tech Telemetry Companion Card */}
          <div className="lg:col-span-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.number}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35 }}
                className="relative rounded-3xl p-8 bg-[#0c0b09] border border-emerald-500/30 text-white shadow-2xl overflow-hidden flex flex-col justify-between min-h-[440px]"
              >
                {/* Rotating radar background */}
                <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full border border-emerald-500/15 pointer-events-none animate-radar">
                  <div className="w-1/2 h-1/2 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-tl-full" />
                </div>

                {/* Top Telemetry Header */}
                <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                    </span>
                    <span className="font-mono text-xs uppercase tracking-wider text-emerald-400 font-semibold">
                      TELEMETRÍA · FASE {currentStep.number}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-white/40">
                    LATENCIA &lt;8 MIN
                  </span>
                </div>

                {/* Center Icon & Headline */}
                <div className="relative z-10 flex flex-col items-center text-center my-auto py-4">
                  <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.25)] mb-5">
                    <StepIcon className="w-10 h-10" />
                  </div>

                  <h4
                    className="text-2xl font-bold text-white mb-2"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {currentStep.title}
                  </h4>
                  
                  <p className="text-[13px] text-white/70 font-light max-w-xs leading-relaxed mb-4">
                    {currentStep.tagline}
                  </p>

                  <div className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-emerald-300 font-mono text-xs text-left">
                    {currentStep.readout}
                  </div>
                </div>

                {/* Bottom Telemetry Box */}
                <div className="relative z-10 pt-4 border-t border-white/10 space-y-1.5 text-[11px] font-mono">
                  <div className="flex justify-between text-white/60">
                    <span>MÓDULO:</span>
                    <span className="text-white font-semibold">{currentStep.telemetry.source}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>ZONA:</span>
                    <span className="text-white font-semibold">{currentStep.telemetry.coverage}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>ESTADO:</span>
                    <span className="text-emerald-400 font-bold">{currentStep.telemetry.status}</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  );
}
