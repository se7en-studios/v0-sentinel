"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Linkedin, Users } from "lucide-react";

const teamMembers = [
  {
    image: "/team-lautaro.jpg",
    name: "Lautaro Silva",
    degree: "Ingeniero Industrial",
    role: "CEO | Founder",
    bio: "Liderazgo en estrategia, desarrollo de productos y asociaciones.",
    linkedin: "https://www.linkedin.com/in/lautaro-silva-0188781a2/",
  },
  {
    image: "/team-franco.jpg",
    name: "Franco Riquero",
    degree: "Tec. Elec | Ingeniero Industrial",
    role: "CDO | Co-Founder",
    bio: "Sensores, IA, datos y hoja de ruta de I+D.",
    linkedin: "https://www.linkedin.com/in/franco-riquero-117492355/",
  },
  {
    image: "/team-alexis.jpg",
    name: "Alexis Ramundo",
    degree: "Tec. Elec | Ingeniero en Sistemas",
    role: "CTO | Co-Founder",
    bio: "Liderazgo técnico. Desarrollo de software y gestión de sistemas.",
    linkedin: "https://www.linkedin.com/in/alexisramundo-dev/",
  },
  {
    image: "/team-martin.jpg",
    name: "Martín Toledano",
    degree: "Tec. Elec | Ingeniero Industrial",
    role: "CFO | Co-Founder",
    bio: "Modelo de negocio, precios y asociaciones industriales.",
    linkedin: "https://www.linkedin.com/in/martin-toledano-804a69264/",
  },
];

export function Team() {
  return (
    <section
      id="equipo"
      className="relative w-full overflow-hidden py-24 lg:py-32 bg-[#faf7f0]"
    >
      <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-10">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-16 flex max-w-2xl flex-col items-center text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase mb-4 bg-emerald-900/10 text-emerald-800 border border-emerald-700/20">
            <Users className="w-3.5 h-3.5 text-emerald-700" />
            <span>Fundadores & Equipo Técnico</span>
          </div>

          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1a1812]"
            style={{
              fontFamily: "var(--font-heading)",
              lineHeight: 1.1,
            }}
          >
            Las personas detrás de Sentinel
          </h2>
          
          <p
            className="mt-4 text-[15px] sm:text-[16px] text-[#1a1812]/70 font-light max-w-xl"
            style={{
              fontFamily: "var(--font-sans)",
            }}
          >
            Cuatro ingenieros de la Patagonia con un objetivo común: que ningún incendio forestal pase desapercibido.
          </p>
        </motion.div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamMembers.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <a
                href={m.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block overflow-hidden rounded-2xl bg-[#0c0b09] shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden">
                  <Image
                    src={m.image}
                    width={480}
                    height={640}
                    alt={m.name}
                    className="h-full w-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c0b09] via-black/30 to-transparent" />
                </div>

                {/* Info Card Overlay */}
                <div
                  className="absolute inset-x-0 bottom-0 p-5 text-white"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-emerald-400 font-semibold">
                      {m.role}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/80 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                      <Linkedin className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <h3
                    className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {m.name}
                  </h3>

                  <p className="text-[11px] text-white/70 font-mono mt-0.5">
                    {m.degree}
                  </p>

                  <p className="text-[12px] text-white/60 font-light mt-2 line-clamp-2 leading-snug">
                    {m.bio}
                  </p>
                </div>
              </a>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
