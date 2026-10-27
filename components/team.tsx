import Image from "next/image";
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
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
      {teamMembers.map((m, i) => (
        <li key={m.name} className="a-rise group min-w-0" style={riseDelay(i)}>
          <div className="relative aspect-[4/5] overflow-hidden bg-[#d3cfc6]">
            <Image
              src={m.image}
              alt={`${m.name}, ${m.role}`}
              fill
              sizes="(max-width: 1024px) 46vw, 270px"
              loading="lazy"
              className="object-cover grayscale transition-[filter] duration-700 ease-out group-hover:grayscale-0 group-focus-within:grayscale-0"
            />
          </div>
          <p className="mt-4 text-base font-semibold leading-snug">
            <a
              href={m.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className={`underline decoration-[#131a16]/25 underline-offset-4 hover:decoration-[#131a16] ${aFocus}`}
            >
              {m.name}
              <span className="sr-only"> (LinkedIn, abre en pestaña nueva)</span>
            </a>
          </p>
          <p className="text-sm text-[#4b5750]">{m.role.split(" | ")[0]}</p>
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
