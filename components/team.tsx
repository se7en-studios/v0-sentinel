import Image from "next/image";
import { ASection, AHeading, aFocus } from "@/components/a-section";
import { MarqueeRow } from "@/components/ui/marquee-row";

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
    linkedin: "https://www.linkedin.com/in/francoriquero/",
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

type Member = (typeof teamMembers)[number];

function TeamCard({ m, hidden }: { m: Member; hidden?: boolean }) {
  return (
    <li aria-hidden={hidden || undefined} className="group relative aspect-[4/5] w-60 shrink-0 overflow-hidden rounded-2xl bg-[#d3cfc6] sm:w-72">
      <Image
        src={m.image}
        alt={hidden ? "" : `${m.name}, ${m.role}`}
        fill
        sizes="600px" quality={90}
        loading="lazy"
        className="object-cover grayscale transition-[filter] duration-700 ease-out group-hover:grayscale-0 group-focus-within:grayscale-0"
      />
      <div className="absolute inset-x-0 bottom-0 bg-[#e6e3dc]/90 p-3">
        <p className="text-base font-semibold leading-snug">
          <a
            href={m.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={hidden ? -1 : undefined}
            className={`after:absolute after:inset-0 ${aFocus}`}
          >
            {m.name}
            <span className="sr-only"> (LinkedIn, abre en pestaña nueva)</span>
          </a>
        </p>
        <p className="text-[0.9375rem] text-[#4b5750]">{m.role.split(" | ")[0]}</p>
      </div>
    </li>
  );
}

// Carrusel continuo; con solo 4 personas se repiten para que cada mitad llene la pantalla.
export function TeamBlock() {
  return (
    <MarqueeRow>
      {(hidden) =>
        [0, 1].flatMap((n) =>
          teamMembers.map((m) => <TeamCard key={`${n}-${m.name}`} m={m} hidden={hidden || n === 1} />),
        )
      }
    </MarqueeRow>
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
