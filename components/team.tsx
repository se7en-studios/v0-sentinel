import Image from "next/image";
import { Linkedin } from "lucide-react";
import { Chapter, Eyebrow } from "@/components/ui/chapter";

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

export function TeamBlock() {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
      {teamMembers.map((m) => (
        <li key={m.name}>
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-ash">
            <Image
              src={m.image}
              alt={`${m.name}, ${m.role}`}
              fill
              sizes="(max-width: 1024px) 46vw, 270px"
              loading="lazy"
              className="object-cover"
            />
          </div>
          <p className="t-label mt-4 text-[#0b6b44]">{m.role}</p>
          <h3 className="t-h3 mt-1">{m.name}</h3>
          <p className="t-small mt-1 opacity-75">{m.degree}</p>
          <p className="t-small mt-2 opacity-90">{m.bio}</p>
          <a
            href={m.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`LinkedIn de ${m.name} (abre en pestaña nueva)`}
            className="mt-3 inline-flex h-11 w-11 items-center justify-center rounded-full border border-foreground/20 text-foreground/80 transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Linkedin className="h-4 w-4" aria-hidden />
          </a>
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
