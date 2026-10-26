"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Flame, Clock, TreePine, AlertTriangle, ShieldAlert } from "lucide-react";

const problemCards = [
  {
    icon: TreePine,
    tag: "Pérdida Ecológica",
    title: "Pulmón verde en riesgo",
    body: "Bosques nativos milenarios que tardan décadas en regenerarse se pierden en cuestión de horas ante la falta de aviso temprano.",
    metric: "-70%",
    metricLabel: "Tiempo de reacción crítico",
  },
  {
    icon: AlertTriangle,
    tag: "Impacto Humano",
    title: "Comunidades amenazadas",
    body: "Familias enteras, áreas productivas y centros turísticos sufren el avance descontrolado del fuego en las zonas de interfaz urbano-forestal.",
    metric: "100+",
    metricLabel: "Hogares expuestos por foco",
  },
  {
    icon: Clock,
    tag: "Ventana Operativa",
    title: "Detección tardía",
    body: "Cuando el fuego es visible a simple vista desde una torre o por una columna de humo, el costo logístico y el riesgo para los brigadistas se multiplica por diez.",
    metric: "10x",
    metricLabel: "Costo de combate tardío",
  },
];

export function Problem() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const imgScale = useTransform(scrollYProgress, [0, 1], [1.1, 1.0]);
  const imgY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <section ref={containerRef} className="relative bg-[#faf7f0] overflow-hidden">
      
      {/* Hero Image Section with Cinematic Parallax */}
      <div className="relative h-[65vh] min-h-[480px] overflow-hidden">
        <motion.div
          style={{ scale: imgScale, y: imgY }}
          className="absolute -top-[10%] left-0 right-0 -bottom-[10%] will-change-transform"
        >
          <Image
            src="/a3.jpg"
            alt="Bomberos enfrentando incendio forestal en la Patagonia"
            fill
            sizes="100vw"
            priority={false}
            className="object-cover"
          />
        </motion.div>

        {/* Ambient Dark Gradient & Thermal Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0b09] via-[#0c0b09]/60 to-black/30" />
        
        {/* Subtle orange ember glow overlay */}
        <div className="absolute inset-0 bg-radial-gradient from-amber-600/10 via-transparent to-transparent pointer-events-none" />

        <div className="absolute bottom-0 left-0 right-0 px-6 sm:px-10 md:px-16 pb-12 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-mono tracking-wider uppercase mb-4 bg-red-950/60 border border-red-500/40 text-red-300 backdrop-blur-md shadow-[0_0_20px_rgba(239,68,68,0.25)]"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span>EMERGENCIA TERRITORIAL · PATAGONIA</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-[-0.03em] text-[#faf7f0] max-w-3xl"
            style={{ fontFamily: "var(--font-heading)", lineHeight: 1.05 }}
          >
            Hoy la Patagonia duele.
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-white/80 max-w-xl text-[15px] sm:text-[17px] mt-4 font-light leading-relaxed"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Cada temporada se repite el mismo drama: incendios que avanzan antes de que alguien pueda dar la alarma.
          </motion.p>
        </div>
      </div>

      {/* Narrative & Problem Grid */}
      <div className="py-20 lg:py-28 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left Column (Editorial Context & Cards) */}
            <div className="lg:col-span-7 space-y-8">
              <div>
                <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-emerald-800 font-semibold">
                  Diagnóstico en Territorio
                </span>
                <h3
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#1a1812] mt-2 mb-4"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  No es solo bosque lo que se quema.
                </h3>
                <p
                  className="text-[16px] leading-relaxed text-[#1a1812]/75 font-light"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Detrás de cada hectárea hay un hogar, una fuente de trabajo y una biodiversidad que no vuelve a crecer en lo que dura una vida. La diferencia entre un conato controlado y una catástrofe son los primeros 15 minutos.
                </p>
              </div>

              {/* High-Tech Problem Cards */}
              <div className="space-y-4">
                {problemCards.map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <motion.div
                      key={card.title}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.12 }}
                      className="group relative p-5 sm:p-6 rounded-2xl bg-white/70 border border-black/5 hover:border-red-400/40 hover:bg-white hover:shadow-xl hover:shadow-red-500/5 transition-all duration-300"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-100 group-hover:scale-110 group-hover:bg-red-500 group-hover:text-white transition-all duration-300 shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-red-600/80 font-semibold">
                              {card.tag}
                            </span>
                            <span className="text-[12px] font-mono font-bold text-red-700 bg-red-100/60 px-2 py-0.5 rounded">
                              {card.metric}
                            </span>
                          </div>
                          <h4
                            className="text-[16px] font-bold text-[#1a1812] group-hover:text-red-950 transition-colors"
                            style={{ fontFamily: "var(--font-sans)" }}
                          >
                            {card.title}
                          </h4>
                          <p className="text-[13px] text-[#1a1812]/70 font-light mt-1.5 leading-relaxed">
                            {card.body}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <a
                  href="#contacto"
                  className="group inline-flex items-center gap-2 px-7 py-3.5 text-[13px] font-medium rounded-full transition-all duration-300 border border-emerald-700/30 bg-emerald-900/10 text-emerald-900 hover:bg-emerald-900 hover:text-white hover:scale-[1.03] active:scale-[0.98] shadow-sm hover:shadow-lg"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  <span>Sumar mi municipio o campo a Sentinel</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </div>
            </div>

            {/* Right Column (Dynamic Visual Impact Cards) */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4 lg:sticky lg:top-28">
              {[
                { src: "/problem-a2.jpg", caption: "Brigadistas en combate directo", badge: "Frente de Fuego" },
                { src: "/problem-a1.jpg", caption: "Cenizas y suelo patagónico", badge: "Daño Residual" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
                  className="group relative overflow-hidden rounded-2xl shadow-lg border border-black/10 aspect-[3/4]"
                >
                  <Image
                    src={item.src}
                    alt={item.caption}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-mono tracking-wider uppercase px-2.5 py-1 rounded-full bg-black/60 text-white/90 backdrop-blur-md border border-white/20">
                      {item.badge}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-[12px] font-medium text-white/95 leading-tight">
                      {item.caption}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
