"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { blogPosts } from "@/lib/blog-posts";
import { formatDate } from "@/lib/format-date";

export function BlogTeaser() {
  const posts = [...blogPosts]
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .slice(0, 3);

  return (
    <section
      className="relative py-24 lg:py-32 overflow-hidden bg-[#faf7f0]"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase mb-4 bg-emerald-900/10 text-emerald-800 border border-emerald-700/20">
              <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
              <span>Publicaciones & Artículos</span>
            </div>

            <h2
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1a1812]"
              style={{ fontFamily: "var(--font-heading)", lineHeight: 1.05 }}
            >
              Últimas <span className="text-[var(--green-aa)]">notas.</span>
            </h2>

            <p
              className="mt-4 max-w-lg text-[15px] leading-relaxed text-[#1a1812]/70 font-light"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Análisis sobre prevención de incendios forestales, teledetección satelital, tecnologías climáticas y gestión territorial en la Patagonia.
            </p>
          </div>

          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[13px] font-medium transition-all duration-300 border border-black/15 bg-white shadow-sm hover:shadow-md hover:border-emerald-600/40 hover:text-emerald-900 w-fit"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            <span>Ver todas las notas</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Featured Post (3 cols) */}
          {posts[0] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-3"
            >
              <Link
                href={`/blog/${posts[0].slug}`}
                className="group flex flex-col h-full overflow-hidden rounded-3xl bg-white border border-black/5 shadow-md hover:shadow-2xl hover:border-emerald-600/30 transition-all duration-300"
              >
                <div className="relative w-full aspect-[16/9] overflow-hidden">
                  <Image
                    src={posts[0].coverImage}
                    alt={posts[0].title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  
                  <div className="absolute top-4 left-4">
                    <span className="text-[10px] font-mono tracking-wider uppercase px-3 py-1 rounded-full bg-black/60 text-emerald-300 backdrop-blur-md border border-white/20">
                      Destacado
                    </span>
                  </div>
                </div>

                <div className="p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 text-xs text-emerald-800 font-mono mb-3">
                      <span>{formatDate(posts[0].publishedAt)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 5 min lectura
                      </span>
                    </div>

                    <h3
                      className="text-2xl sm:text-3xl font-bold text-[#1a1812] group-hover:text-emerald-900 transition-colors mb-3 leading-snug"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {posts[0].title}
                    </h3>

                    <p className="text-[14px] text-[#1a1812]/70 font-light leading-relaxed line-clamp-3">
                      {posts[0].excerpt}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-emerald-800 group-hover:text-emerald-700">
                    <span>Leer artículo completo</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            </motion.div>
          )}

          {/* Side Posts (2 cols) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {posts.slice(1, 3).map((post, i) => (
              <motion.div
                key={post.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
                className="flex-1"
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col h-full p-6 sm:p-7 rounded-3xl bg-white border border-black/5 shadow-md hover:shadow-xl hover:border-emerald-600/30 transition-all duration-300 justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3 text-xs text-emerald-800 font-mono mb-2">
                      <span>{formatDate(post.publishedAt)}</span>
                      <span>•</span>
                      <span>Lectura: 4 min</span>
                    </div>

                    <h3
                      className="text-lg sm:text-xl font-bold text-[#1a1812] group-hover:text-emerald-900 transition-colors mb-2 leading-snug"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {post.title}
                    </h3>

                    <p className="text-[13px] text-[#1a1812]/70 font-light line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-800 group-hover:text-emerald-700">
                    <span>Leer más</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
