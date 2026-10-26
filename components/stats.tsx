"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Trophy, Star, Shield, Award } from "lucide-react";

const stats = [
  {
    icon: Flame,
    value: 98,
    suffix: "%",
    label: "Precisión objetivo en detección",
    detail: "Filtrado neuronal de falsos positivos",
    badge: "Eficiencia de Algoritmo",
  },
  {
    icon: Trophy,
    value: 700,
    suffix: "+",
    label: "Propuestas superadas en certámenes",
    detail: "Distinción BNA Conectar & Emprendimientos 2025",
    badge: "Validación de Ecosistema",
  },
  {
    icon: Star,
    value: 11,
    suffix: "",
    label: "Reconocimientos y programas",
    detail: "Aceleradoras, menciones de honor y apoyos institucionales",
    badge: "Track Record",
  },
];

function AnimatedCounter({
  value,
  suffix,
  isVisible,
}: {
  value: number;
  suffix: string;
  isVisible: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    const duration = 1800;
    const startTime = performance.now();
    let frameId: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(value * easeOut));
      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isVisible, value]);

  return (
    <span>
      {count.toLocaleString("es-AR")}
      <span className="text-emerald-700">{suffix}</span>
    </span>
  );
}

export function Stats() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px 150px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-24 lg:py-32 overflow-hidden bg-[#faf7f0]"
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(15,122,79,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;

            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 24 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="group relative rounded-3xl p-8 sm:p-10 bg-white border border-black/5 shadow-md hover:shadow-2xl hover:border-emerald-600/30 transition-all duration-300 flex flex-col justify-between text-center items-center"
              >
                {/* Top Badge */}
                <div className="mb-6 flex items-center justify-between w-full">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-800 border border-emerald-600/20 group-hover:scale-110 group-hover:bg-emerald-900 group-hover:text-emerald-300 transition-all duration-300">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono tracking-wider uppercase bg-emerald-100/70 text-emerald-900 font-semibold px-2.5 py-1 rounded-full">
                    {stat.badge}
                  </span>
                </div>

                {/* Animated Number */}
                <div
                  className="text-5xl sm:text-6xl font-black mb-3 tracking-tight text-[#1a1812] tabular-nums"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  <AnimatedCounter
                    value={stat.value}
                    suffix={stat.suffix}
                    isVisible={isVisible}
                  />
                </div>

                {/* Main Label */}
                <h4
                  className="text-[15px] font-bold text-[#1a1812] mb-2 leading-snug"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {stat.label}
                </h4>

                {/* Micro detail */}
                <p
                  className="text-[12px] text-[#1a1812]/60 font-light leading-relaxed max-w-[240px]"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {stat.detail}
                </p>

                {/* Interactive bottom bar */}
                <div className="mt-6 w-12 h-1 rounded-full bg-emerald-600/20 group-hover:w-24 group-hover:bg-emerald-600 transition-all duration-300" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
