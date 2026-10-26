"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Thermometer,
  Satellite,
  BellRing,
  LayoutDashboard,
  Radio,
  BarChart3,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";

const capabilities = [
  {
    icon: Thermometer,
    badge: "Core AI",
    title: "Detección térmica con IA",
    description:
      "Algoritmos de visión computacional y modelos térmicos infrarrojos entrenados para detectar focos nacientes antes de que superen la copa de los árboles.",
    metrics: [
      { value: "8 min", label: "Tiempo promedio" },
      { value: "98%", label: "Precisión de foco" },
    ],
    className: "lg:col-span-2 lg:row-span-2 bg-[#0c0b09] text-white",
    dark: true,
  },
  {
    icon: BellRing,
    badge: "Inmediata",
    title: "Alertas geolocalizadas",
    description: "Coordenadas exactas enviadas al instante con radio de dispersión por viento a brigadas locales.",
    className: "lg:col-span-1 bg-white text-[#1a1812]",
    dark: false,
  },
  {
    icon: LayoutDashboard,
    badge: "Control Central",
    title: "Dashboard en tiempo real",
    description: "Cartografía interactiva para intendencias, defensas civiles y administradores de parques nacionales.",
    className: "lg:col-span-1 bg-white text-[#1a1812]",
    dark: false,
  },
  {
    icon: Radio,
    badge: "Interoperable",
    title: "Integración con brigadas",
    description: "Despacho directo por canales móviles, WhatsApp, radio VHF digital y plataformas existentes.",
    className: "lg:col-span-1 bg-white text-[#1a1812]",
    dark: false,
  },
  {
    icon: BarChart3,
    badge: "Inteligencia Predictiva",
    title: "Reportes y analítica",
    description: "Modelado de combustible vegetal seco, historial de igniciones y estimación de severidad ecológica.",
    className: "lg:col-span-1 bg-white text-[#1a1812]",
    dark: false,
  },
  {
    icon: Satellite,
    badge: "Constelación Dual",
    title: "Cobertura satelital con drones en expansión",
    description:
      "Vigilancia continua sobre millones de hectáreas en la cordillera, sumando enjambre de drones autónomos para confirmación visual a baja altura.",
    className: "lg:col-span-2 bg-gradient-to-br from-emerald-950 via-[#0c0b09] to-black text-white",
    dark: true,
  },
];

export function Capabilities() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <section
      id="capacidades"
      className="relative py-24 lg:py-32 bg-[#faf7f0] overflow-hidden"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 35% 45%, rgba(15,122,79,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase mb-4 bg-emerald-900/10 text-emerald-800 border border-emerald-700/20">
            <Sparkles className="w-3 h-3 text-emerald-700" />
            <span>Capacidades del Sistema</span>
          </div>
          
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1a1812] mb-4"
            style={{ fontFamily: "var(--font-heading)", lineHeight: 1.05 }}
          >
            Todo lo que <span className="text-[var(--green-aa)]">Sentinel</span> hace por el territorio.
          </h2>
          
          <p
            className="text-[15px] sm:text-[16px] text-[#1a1812]/70 font-light max-w-2xl mx-auto"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Módulos modulares integrados en una arquitectura en la nube de alta disponibilidad, diseñada específicamente para las condiciones geográficas de la Patagonia.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {capabilities.map((cap, i) => {
            const Icon = cap.icon;
            const isHovered = hoveredIdx === i;

            return (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`group relative rounded-3xl p-7 sm:p-8 overflow-hidden transition-all duration-300 border ${cap.className} ${
                  cap.dark
                    ? "border-emerald-500/20 shadow-2xl hover:border-emerald-400/40 hover:shadow-[0_0_35px_rgba(16,185,129,0.15)]"
                    : "border-black/5 shadow-md hover:shadow-xl hover:border-emerald-600/30"
                }`}
              >
                {/* Background dot matrix on dark cards */}
                {cap.dark && (
                  <div
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{
                      backgroundImage:
                        "radial-gradient(rgba(148,241,190,0.5) 1px, transparent 1px)",
                      backgroundSize: "20px 20px",
                    }}
                  />
                )}

                {/* Rotating radar on flagship dark card */}
                {cap.dark && i === 0 && (
                  <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full border border-emerald-500/15 pointer-events-none animate-radar">
                    <div className="w-1/2 h-1/2 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-tl-full" />
                  </div>
                )}

                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-6">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                          cap.dark
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                            : "bg-emerald-50 text-emerald-800 border border-emerald-600/20"
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>

                      <span
                        className={`text-[10px] font-mono tracking-wider uppercase font-semibold px-2.5 py-1 rounded-full ${
                          cap.dark
                            ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/40"
                            : "bg-black/5 text-[#1a1812]/70"
                        }`}
                      >
                        {cap.badge}
                      </span>
                    </div>

                    <h3
                      className="text-xl sm:text-2xl font-bold tracking-tight mb-3"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {cap.title}
                    </h3>

                    <p
                      className={`text-[13px] sm:text-[14px] leading-relaxed font-light ${
                        cap.dark ? "text-white/75" : "text-[#1a1812]/70"
                      }`}
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      {cap.description}
                    </p>
                  </div>

                  {/* Flagship metrics if available */}
                  {cap.metrics && (
                    <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/10">
                      {cap.metrics.map((m) => (
                        <div key={m.label} className="p-3 rounded-xl bg-white/5 border border-white/5">
                          <div
                            className="text-2xl sm:text-3xl font-bold text-emerald-400"
                            style={{ fontFamily: "var(--font-heading)" }}
                          >
                            {m.value}
                          </div>
                          <div className="text-[10px] font-mono uppercase tracking-wider text-white/60 mt-1">
                            {m.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Micro action prompt on hover */}
                  <div className="mt-6 flex items-center gap-1.5 text-xs font-medium text-emerald-400/80 group-hover:text-emerald-400 transition-colors">
                    <span className="text-[11px] font-mono uppercase tracking-wider">Ver especificaciones</span>
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
