"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SmoothScrollHero from "@/components/ui/smooth-scroll-hero";
import { Satellite, ShieldCheck, Flame, ArrowRight, Activity } from "lucide-react";

const stats = [
  { target: 8, suffix: "min", label: "Objetivo de detección", detail: "Alerta en tiempo real" },
  { target: 24, suffix: "h", label: "Monitoreo continuo", detail: "Satélites activos 24/7" },
  { target: 98, suffix: "%", label: "Precisión objetivo", detail: "Filtrado con IA" },
];

function useCountUp(target: number, isVisible: boolean, duration = 1600) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    const start = performance.now();
    let frameId: number;
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // smooth cubic ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isVisible, target, duration]);

  return count;
}

function AnimatedStat({
  target,
  suffix,
  label,
  detail,
  index,
}: {
  target: number;
  suffix: string;
  label: string;
  detail: string;
  index: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 200 + index * 150);
    return () => clearTimeout(timer);
  }, [index]);

  const count = useCountUp(target, mounted);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 + index * 0.12 }}
      className="group relative px-4 py-3 sm:px-6 sm:py-4 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md transition-all duration-300 hover:border-emerald-500/40 hover:bg-black/60 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]"
    >
      <div
        className="leading-none font-bold tracking-tight"
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
          color: "rgba(240,234,216,0.98)",
        }}
      >
        <span>{count}</span>
        <span className="text-emerald-400 font-extrabold">{suffix}</span>
      </div>
      <div
        className="mt-1.5"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "rgba(240,234,216,0.9)",
        }}
      >
        {label}
      </div>
      <div
        className="hidden sm:block text-[10px] text-emerald-400/80 font-mono mt-0.5 tracking-wider"
      >
        {detail}
      </div>
    </motion.div>
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
        <div className="relative flex flex-col items-center text-center max-w-4xl mx-auto px-4 z-10">
          
          {/* Subtle Ambient Radial Mesh Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-emerald-500/20 via-emerald-950/10 to-transparent blur-3xl pointer-events-none -z-10" />

          {/* Top Live Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-medium tracking-wider uppercase mb-6 bg-black/60 border border-emerald-500/40 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            style={{
              fontFamily: "var(--font-sans)",
              color: "#94f1be",
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="font-mono text-emerald-300 font-semibold">Sentinel Cloud · Patagonia</span>
            <span className="text-white/30">|</span>
            <span className="text-[10px] text-white/70 font-mono hidden sm:inline">SAT COBERTURA ACTIVA</span>
          </motion.div>

          {/* Main Title with high impact visual contrast */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-extrabold tracking-[-0.03em] text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6 text-balance"
            style={{
              fontFamily: "var(--font-heading)",
              lineHeight: 1.05,
              color: "rgba(240,234,216,0.98)",
            }}
          >
            Detectamos{" "}
            <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-[#94f1be] to-teal-200 drop-shadow-[0_0_30px_rgba(148,241,190,0.35)]">
              incendios en minutos,
            </span>{" "}
            no en horas
          </motion.h1>

          {/* Subtitle with high legibility and telemetry focus */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-2xl text-[15px] sm:text-[17px] leading-relaxed mb-8"
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 300,
              color: "rgba(240,234,216,0.85)",
            }}
          >
            Sentinel Cloud cruza telemetría satelital (VIIRS, MODIS, GOES-19), información geoespacial e IA para vigilar el territorio y alertar a{" "}
            <strong className="font-semibold text-white">
              municipios, brigadas y grandes propietarios
            </strong>{" "}
            apenas aparece un foco térmico real.
          </motion.p>

          {/* High-Tech Dynamic Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full max-w-3xl mb-10">
            {stats.map((s, i) => (
              <AnimatedStat
                key={s.label}
                target={s.target}
                suffix={s.suffix}
                label={s.label}
                detail={s.detail}
                index={i}
              />
            ))}
          </div>

          {/* Interactive CTAs with Shimmer Beam */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <a
              href="#contacto"
              className="group relative overflow-hidden inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full text-[14px] font-semibold text-[#0c0b09] bg-gradient-to-r from-emerald-400 to-[#94f1be] transition-all duration-300 hover:scale-[1.04] active:scale-[0.98] shadow-[0_0_30px_rgba(148,241,190,0.4)] hover:shadow-[0_0_40px_rgba(148,241,190,0.6)] w-full sm:w-auto"
              style={{
                fontFamily: "var(--font-sans)",
                letterSpacing: "0.03em",
              }}
            >
              {/* Shimmer sweep effect */}
              <span className="absolute inset-0 w-1/2 h-full bg-white/40 skew-x-[-20deg] -translate-x-[200%] group-hover:animate-[shimmer_1.5s_infinite]" />
              
              <Activity className="w-4 h-4 text-emerald-950" />
              <span>Solicitar reunión</span>
              <ArrowRight className="w-4 h-4 text-emerald-950 transition-transform duration-300 group-hover:translate-x-1" />
            </a>

            <a
              href="#recorrido"
              className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-[14px] font-medium transition-all duration-300 border border-white/20 bg-black/40 backdrop-blur-md hover:bg-white/10 hover:border-emerald-400/50 hover:text-emerald-300 text-[rgba(240,234,216,0.9)] w-full sm:w-auto"
              style={{
                fontFamily: "var(--font-sans)",
              }}
            >
              <span>Ver el recorrido</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 group-hover:bg-emerald-400 transition-colors" />
            </a>
          </motion.div>

          {/* Coordinate Telemetry Footnote */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="mt-8 flex items-center justify-center gap-4 text-[11px] font-mono text-emerald-400/70"
          >
            <span className="flex items-center gap-1.5">
              <Satellite className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              SENSORES TÉRMICOS & SATÉLITES LEO / GEO
            </span>
            <span className="text-white/20">|</span>
            <span className="hidden sm:inline text-white/50">COBERTURA: ANDES PATAGÓNICOS</span>
          </motion.div>

        </div>
      </SmoothScrollHero>
    </div>
  );
}
