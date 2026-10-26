"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Flame,
  Radar,
  Satellite,
  BellRing,
  Plane,
  Thermometer,
  ShieldCheck,
  Cpu,
  ArrowRight,
} from "lucide-react";

const flow = [
  {
    icon: Flame,
    step: "01",
    label: "Detectar",
    tagline: "Anomalías térmicas en órbita",
    desc: "Identificación inmediata de puntos calientes mediante sensores satelitales infrarrojos (VIIRS, MODIS, GOES-19).",
    color: "#f87171",
  },
  {
    icon: Radar,
    step: "02",
    label: "Verificar",
    tagline: "Filtrado con IA avanzada",
    desc: "Modelos neuronales descartan falsos positivos (chimeneas, reflejos, nubes calientes) con 98% de precisión.",
    color: "#fbbf24",
  },
  {
    icon: Satellite,
    step: "03",
    label: "Contextualizar",
    tagline: "Capas geoespaciales y clima",
    desc: "Cruce de datos de viento, pendiente de terreno, vegetación y humedad de combustible para predecir propagación.",
    color: "#38bdf8",
  },
  {
    icon: BellRing,
    step: "04",
    label: "Alertar",
    tagline: "Despacho a brigadistas",
    desc: "Notificación geolocalizada en menos de 8 minutos vía WhatsApp y consola directa a bomberos y municipios.",
    color: "#4ade80",
  },
];

const monitoring = [
  {
    icon: Plane,
    text: "Verificación automatizada de cada foco con datos satelitales y contexto geoespacial.",
    badge: "Satelital + Drones",
  },
  {
    icon: Thermometer,
    text: "Sensores y drones en el territorio, sumándose de forma progresiva a la cobertura satelital.",
    badge: "IoT en Campo",
  },
  {
    icon: Satellite,
    text: "Datos satelitales (VIIRS, MODIS y GOES-19) para contexto de riesgo y mapeo continuo 24/7.",
    badge: "Constelación LEO/GEO",
  },
];

export function Features() {
  const [activeStep, setActiveStep] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // Auto cycle active step when not hovering
  useEffect(() => {
    if (isHovering) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % flow.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [isHovering]);

  return (
    <section
      id="nosotros"
      className="relative py-24 lg:py-32 bg-[#faf7f0] overflow-hidden"
    >
      {/* Background radial ambient light */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(15,122,79,0.07) 0%, transparent 70%)",
        }}
      />

      {/* Modern High-Tech Grid Accent */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#0f7a4f_1px,transparent_1px),linear-gradient(to_bottom,#0f7a4f_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="relative max-w-5xl mx-auto px-6 lg:px-10 text-center">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase mb-4 bg-emerald-900/10 text-emerald-800 border border-emerald-700/20">
            <Cpu className="w-3 h-3 text-emerald-700" />
            <span>Arquitectura Tecnológica</span>
          </div>

          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1a1812] mb-6"
            style={{ fontFamily: "var(--font-heading)", lineHeight: 1.05 }}
          >
            Nuestra <span className="text-[var(--green-aa)]">solución</span> en 4 etapas.
          </h2>

          <p
            className="max-w-2xl mx-auto text-[15px] sm:text-[16px] leading-relaxed text-[#1a1812]/75 font-light"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Un ecosistema integral que combina constelaciones satelitales, capas
            geoespaciales e inteligencia artificial para transformar una respuesta{" "}
            <span className="font-medium text-[#1a1812]">reactiva</span> en una acción{" "}
            <span className="font-semibold text-emerald-800">preventiva y quirúrgica</span>.
          </p>
        </motion.div>
      </div>

      {/* ── PIPELINE INTERACTIVO CON PULSO ELÉCTRICO ── */}
      <div
        className="relative max-w-6xl mx-auto px-6 lg:px-10 mt-16 lg:mt-24"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Electric animated connection rail */}
        <div className="hidden sm:block absolute top-[44px] left-[10%] right-[10%] h-[3px] bg-emerald-950/10 rounded-full overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-1/3 h-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_12px_rgba(16,185,129,0.8)]"
          />
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 relative z-10">
          {flow.map((step, i) => {
            const Icon = step.icon;
            const isCurrent = activeStep === i;

            return (
              <motion.button
                key={step.label}
                type="button"
                onClick={() => setActiveStep(i)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`group text-left p-5 rounded-2xl transition-all duration-300 relative overflow-hidden border ${
                  isCurrent
                    ? "bg-white border-emerald-500/40 shadow-xl shadow-emerald-900/10 scale-[1.03]"
                    : "bg-white/60 border-black/5 hover:bg-white hover:border-black/10 hover:shadow-md"
                }`}
              >
                {/* Active Indicator Top Pill */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isCurrent
                        ? "bg-emerald-900 text-emerald-300 shadow-md shadow-emerald-900/20"
                        : "bg-emerald-50 text-emerald-800 group-hover:scale-105"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span
                    className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                      isCurrent
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-black/5 text-[#1a1812]/50"
                    }`}
                  >
                    FASE {step.step}
                  </span>
                </div>

                <h3
                  className="text-lg font-bold text-[#1a1812] mb-1 group-hover:text-emerald-900 transition-colors"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {step.label}
                </h3>
                <p className="text-[12px] font-medium text-emerald-800 mb-2">
                  {step.tagline}
                </p>
                <p className="text-[12px] text-[#1a1812]/70 font-light leading-relaxed">
                  {step.desc}
                </p>

                {/* Bottom Active Glow Bar */}
                {isCurrent && (
                  <motion.div
                    layoutId="activeFeatureBar"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-[#94f1be]"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── LIVE SIMULATION CONSOLE PREVIEW ── */}
      <div className="max-w-4xl mx-auto px-6 lg:px-10 mt-10">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl bg-[#0c0b09] border border-emerald-500/30 p-6 text-white/90 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle radar sweep in console background */}
          <div className="absolute right-[-20px] -bottom-[20px] w-64 h-64 rounded-full border border-emerald-500/10 pointer-events-none animate-radar">
            <div className="w-1/2 h-1/2 bg-gradient-to-br from-emerald-400/15 to-transparent rounded-tl-full" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="font-mono text-xs tracking-wider text-emerald-400 font-semibold uppercase">
                Telemetría Activa: Fase {flow[activeStep].step} · {flow[activeStep].label}
              </span>
            </div>
            <div className="font-mono text-[11px] text-white/50">
              MODO: CONTINUO · LATENCIA: &lt;8 MIN
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-white/5 border border-white/5">
              <span className="text-white/40 block text-[10px] uppercase">Fuente Primaria</span>
              <span className="text-emerald-300 font-bold text-[13px]">
                {activeStep === 0 && "VIIRS / MODIS / GOES-19"}
                {activeStep === 1 && "Red Neuronal Sentinel-V2"}
                {activeStep === 2 && "ERA5 + Cartografía IGN"}
                {activeStep === 3 && "API WhatsApp / Dispatcher"}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/5">
              <span className="text-white/40 block text-[10px] uppercase">Estado de Proceso</span>
              <span className="text-emerald-300 font-bold text-[13px]">
                {activeStep === 0 && "BARRIDO SATELITAL ACTIVO"}
                {activeStep === 1 && "FILTRADO FALSOS POSITIVOS: 98%"}
                {activeStep === 2 && "PROPAGACIÓN ESTIMADA: CALCULADA"}
                {activeStep === 3 && "DESTINATARIOS: BRIGADA NOTIFICADA"}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/5">
              <span className="text-white/40 block text-[10px] uppercase">Objetivo Operativo</span>
              <span className="text-emerald-300 font-bold text-[13px]">
                {activeStep === 0 && "Detección térmica <15 min"}
                {activeStep === 1 && "Cero alarmas falsas"}
                {activeStep === 2 && "Priorización por riesgo"}
                {activeStep === 3 && "Intervención temprana"}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── SUPPORTING FACTS PILLS ── */}
      <div className="relative max-w-4xl mx-auto px-6 lg:px-10 mt-14">
        <div className="flex flex-wrap justify-center gap-3">
          {monitoring.map((item) => (
            <div
              key={item.badge}
              className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/80 border border-black/10 shadow-sm transition-all hover:scale-105"
            >
              <item.icon className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="text-[12px] font-light text-[#1a1812]/80">
                {item.text}
              </span>
              <span className="text-[10px] font-mono font-semibold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
