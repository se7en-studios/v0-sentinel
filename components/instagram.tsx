"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Instagram, ArrowUpRight } from "lucide-react";

const posts = [
  {
    image: "/ig-post-1.jpg",
    caption:
      "Un incendio detectado en los primeros minutos se controla. Uno detectado horas después, arrasa. Sentinel apunta a detectar focos activos lo antes posible con datos satelitales e IA.",
    alt: "Publicación de Sentinel sobre detección temprana de incendios",
    href: "https://www.instagram.com/p/DWmLb_DjvIA/",
    likes: "Comunidad Activa",
  },
  {
    image: "/ig-post-2.jpg",
    caption:
      "Con Sentinel pasás de reaccionar a predecir. Monitorear → Detectar/Verificar → Contextualizar → Alertar. Así funciona la protección real del territorio.",
    alt: "Publicación de Sentinel con el ciclo monitorear, detectar, contextualizar y alertar",
    href: "https://www.instagram.com/p/DWmLh-Bjn91/",
    likes: "Territorio & Tecnología",
  },
  {
    image: "/ig-post-3.jpg",
    caption:
      "El fuego no da segundas oportunidades. Usamos sistemas de detección temprana e inteligencia territorial para identificar el peligro antes de que sea incontrolable.",
    alt: "Publicación de Sentinel sobre detección temprana e inteligencia territorial",
    href: "https://www.instagram.com/p/DZL3LoIjMNn/",
    likes: "Misión Patagonia",
  },
];

export function InstagramFeed() {
  return (
    <section
      className="relative py-24 lg:py-32 overflow-hidden bg-[#faf7f0]"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(15,122,79,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-16"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase mb-4 bg-emerald-900/10 text-emerald-800 border border-emerald-700/20">
              <Instagram className="w-3.5 h-3.5 text-emerald-700" />
              <span>Comunidad en Redes</span>
            </div>

            <h2
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1a1812]"
              style={{ fontFamily: "var(--font-heading)", lineHeight: 1.05 }}
            >
              Seguinos en <span className="text-[var(--green-aa)]">Instagram.</span>
            </h2>

            <p
              className="mt-4 text-[15px] text-[#1a1812]/70 font-light max-w-md"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Novedades sobre operativos, monitoreo de la temporada de incendios y actualizaciones del equipo en territorio.
            </p>
          </div>

          <a
            href="https://www.instagram.com/sentinel.patagonia"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-[13px] font-medium transition-all duration-300 bg-white border border-black/15 shadow-sm hover:shadow-md hover:border-pink-500/30 hover:text-pink-600 w-fit"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            <Instagram className="w-4 h-4 text-pink-600 transition-transform duration-300 group-hover:scale-110" />
            <span>@sentinel.patagonia</span>
            <ArrowUpRight className="w-4 h-4 text-black/40 group-hover:text-pink-600 transition-colors" />
          </a>
        </motion.div>

        {/* 3-Column Instagram Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post, i) => (
            <motion.div
              key={post.href}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
            >
              <a
                href={post.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex flex-col overflow-hidden rounded-3xl bg-white border border-black/5 shadow-md hover:shadow-2xl hover:border-pink-500/30 transition-all duration-300 h-full"
              >
                <div className="relative aspect-square w-full overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white scale-75 group-hover:scale-100 transition-transform duration-300">
                      <Instagram className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="absolute top-4 left-4">
                    <span className="text-[10px] font-mono tracking-wider uppercase px-3 py-1 rounded-full bg-black/60 text-white/90 backdrop-blur-md border border-white/20">
                      {post.likes}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <p
                    className="text-[13px] text-[#1a1812]/75 font-light leading-relaxed line-clamp-3 mb-4"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {post.caption}
                  </p>

                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 group-hover:text-pink-600 transition-colors pt-3 border-t border-black/5">
                    <span>Ver en Instagram</span>
                    <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </a>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
