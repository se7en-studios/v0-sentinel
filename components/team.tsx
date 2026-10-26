import Image from "next/image";
import { Linkedin } from "lucide-react";
import { Chapter, Eyebrow } from "@/components/ui/chapter";

// position: ajuste de encuadre por persona para que las cabezas queden a la misma altura.
const teamMembers = [
  {
    image: "/team-lautaro.jpg",
    position: "50% 20%",
    name: "Lautaro Silva",
    degree: "Ingeniero Industrial",
    role: "CEO | Founder",
    bio: "Liderazgo en estrategia, desarrollo de productos y asociaciones.",
    linkedin: "https://www.linkedin.com/in/lautaro-silva-0188781a2/",
  },
  {
    image: "/team-franco.jpg",
    position: "50% 20%",
    name: "Franco Riquero",
    degree: "Tec. Elec | Ingeniero Industrial",
    role: "CDO | Co-Founder",
    bio: "Sensores, IA, datos y hoja de ruta de I+D.",
    linkedin: "https://www.linkedin.com/in/franco-riquero-117492355/",
  },
  {
    image: "/team-alexis.jpg",
    position: "50% 20%",
    name: "Alexis Ramundo",
    degree: "Tec. Elec | Ingeniero en Sistemas",
    role: "CTO | Co-Founder",
    bio: "Liderazgo técnico. Desarrollo de software y gestión de sistemas.",
    linkedin: "https://www.linkedin.com/in/alexisramundo-dev/",
  },
  {
    image: "/team-martin.jpg",
    position: "50% 20%",
    name: "Martín Toledano",
    degree: "Tec. Elec | Ingeniero Industrial",
    role: "CFO | Co-Founder",
    bio: "Modelo de negocio, precios y asociaciones industriales.",
    linkedin: "https://www.linkedin.com/in/martin-toledano-804a69264/",
  },
];

export function TeamBlock() {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
      {teamMembers.map((m) => (
        <li key={m.name} className="group">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-charcoal shadow-[0_24px_50px_-24px_rgba(18,17,14,0.55)] ring-1 ring-foreground/10 transition-transform duration-500 group-hover:-translate-y-1">
            <Image
              src={m.image}
              alt={`${m.name}, ${m.role}`}
              fill
              sizes="(max-width: 1024px) 46vw, 270px"
              loading="lazy"
              style={{ objectPosition: m.position }}
              className="object-cover saturate-[0.7] transition-[filter,transform] duration-500 group-hover:scale-[1.03] group-hover:saturate-100"
            />
            {/* grading unificado: tinte verde cálido + gradiente inferior; se apaga al hover */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[#2f6b4a]/25 mix-blend-soft-light transition-opacity duration-500 group-hover:opacity-0"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/45 via-35% to-transparent"
            />
            <a
              href={m.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`LinkedIn de ${m.name} (abre en pestaña nueva)`}
              className="glass absolute right-2.5 top-2.5 flex h-11 w-11 items-center justify-center rounded-full text-[#f4efe2]/90 transition-colors hover:text-[#5fe3a1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5fe3a1]"
            >
              <Linkedin className="h-4 w-4" aria-hidden />
            </a>
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="t-label mb-2 inline-block rounded-full bg-[#5fe3a1]/15 px-2.5 py-1 text-[#5fe3a1] ring-1 ring-[#5fe3a1]/30">
                <span className="sm:hidden">{m.role.split(" | ")[0]}</span>
                <span className="hidden sm:inline">{m.role}</span>
              </p>
              <h3 className="t-h3 text-[#f4efe2]">{m.name}</h3>
            </div>
          </div>
          <p className="t-small mt-4 font-medium opacity-80">{m.degree}</p>
          <p className="t-small mt-1 opacity-80">{m.bio}</p>
        </li>
      ))}
    </ul>
  );
}

// Compatibilidad: el capítulo completo vive en Proof.
export function Team() {
  return (
    <Chapter id="equipo">
      <Eyebrow>Equipo</Eyebrow>
      <h2 className="t-h2 mb-12 max-w-3xl">Cuatro ingenieros con un objetivo: llegar antes al fuego.</h2>
      <TeamBlock />
    </Chapter>
  );
}
