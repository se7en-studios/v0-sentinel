import Image from "next/image";
import { Linkedin } from "lucide-react";
import { ASection, AHeading, aFocus, riseDelay } from "@/components/a-section";

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
    <ul className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
      {teamMembers.map((m, i) => (
        <li key={m.name} className="a-rise min-w-0" style={riseDelay(i)}>
        <div className="a-card a-lift group h-full overflow-hidden">
          <div className="relative aspect-[4/5] bg-a-surface">
            <Image
              src={m.image}
              alt={`${m.name}, ${m.role}`}
              fill
              sizes="(max-width: 1024px) 46vw, 270px"
              loading="lazy"
              className="object-cover grayscale transition-[filter,transform] duration-[900ms] ease-out group-hover:scale-[1.03] group-hover:grayscale-0 group-focus-within:grayscale-0"
            />
          </div>
          <div className="p-4 md:p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-a-accent">{m.role}</p>
            <h3 className="mt-1.5 text-lg font-semibold leading-tight text-[#e3f6dc]">{m.name}</h3>
            <p className="mt-1 text-sm text-a-mute">{m.degree}</p>
            <p className="mt-3 text-sm leading-relaxed text-a-mute">{m.bio}</p>
            <a
              href={m.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`LinkedIn de ${m.name} (abre en pestaña nueva)`}
              className={`mt-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-a-line text-a-mute transition-colors hover:border-a-accent hover:text-a-accent ${aFocus}`}
            >
              <Linkedin className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </div>
        </li>
      ))}
    </ul>
  );
}

// Compatibilidad: el capítulo completo vive en Proof.
export function Team() {
  return (
    <ASection id="equipo">
      <AHeading eyebrow="Equipo" title="Cuatro ingenieros con un objetivo: llegar antes al fuego" />
      <div className="mt-14">
        <TeamBlock />
      </div>
    </ASection>
  );
}
