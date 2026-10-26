"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Shield, Sparkles } from "lucide-react";

export function CTA() {
  return (
    <section
      className="relative py-28 lg:py-36 overflow-hidden bg-[#faf7f0]"
    >
      {/* High-tech environmental protection dome glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(15,122,79,0.12) 0%, rgba(148,241,190,0.04) 40%, transparent 70%)",
        }}
      />

      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#0f7a4f_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-10 text-center">
        
        {/* Top Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-mono tracking-wider uppercase mb-6 bg-emerald-900/10 text-emerald-800 border border-emerald-700/20"
        >
          <Shield className="w-3.5 h-3.5 text-emerald-700" />
          <span>Protección Territorial Activa</span>
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1a1812] mb-6"
          style={{
            fontFamily: "var(--font-heading)",
            lineHeight: 1.05,
          }}
        >
          Dejá que Sentinel vigile
          <br />
          <span className="text-[var(--green-aa)]">para que vos puedas actuar.</span>
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-[15px] sm:text-[16px] max-w-2xl mx-auto mb-10 text-[#1a1812]/70 font-light leading-relaxed"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Satélites, geoespacial e inteligencia artificial para detectar incendios forestales antes de que superen la ventana de control.
        </motion.p>

        {/* Guarantees / Value props */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mb-12"
        >
          {[
            "Sin inversión inicial (CAPEX)",
            "Piloto de 4 a 8 semanas",
            "Para municipios, brigadas y propietarios",
          ].map((item) => (
            <div
              key={item}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-black/5 shadow-sm text-[12px] text-[#1a1812]/80 font-medium"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <a
            href="#contacto"
            className="group relative overflow-hidden inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full text-[14px] font-semibold text-[#faf7f0] bg-emerald-800 transition-all duration-300 hover:bg-emerald-900 hover:scale-[1.04] active:scale-[0.98] shadow-lg shadow-emerald-900/20 hover:shadow-xl w-full sm:w-auto"
            style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.03em" }}
          >
            {/* Shimmer light beam */}
            <span className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-[-20deg] -translate-x-[200%] group-hover:animate-[shimmer_1.5s_infinite]" />

            <span>Solicitar reunión</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>

          <a
            href="#contacto"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full text-[14px] font-medium transition-all duration-300 border border-black/15 text-[#1a1812]/75 hover:border-black/30 hover:text-[#1a1812] hover:bg-black/5 active:scale-[0.98] w-full sm:w-auto"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Enviar mensaje
          </a>
        </motion.div>

      </div>
    </section>
  );
}
