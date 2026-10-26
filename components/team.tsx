import Image from "next/image";

// Mismo recorte, mismo tamaño, blanco y negro; el color aparece al pasar el cursor.
const teamMembers = [
  {
    image: "/team-lautaro.jpg",
    name: "Lautaro Silva",
    role: "CEO y fundador",
    bio: "Ingeniero industrial. Estrategia, producto y alianzas.",
    linkedin: "https://www.linkedin.com/in/lautaro-silva-0188781a2/",
  },
  {
    image: "/team-franco.jpg",
    name: "Franco Riquero",
    role: "CDO y cofundador",
    bio: "Técnico electrónico e ingeniero industrial. Sensores, IA y datos.",
    linkedin: "https://www.linkedin.com/in/franco-riquero-117492355/",
  },
  {
    image: "/team-alexis.jpg",
    name: "Alexis Ramundo",
    role: "CTO y cofundador",
    bio: "Técnico electrónico e ingeniero en sistemas. Software y sistemas.",
    linkedin: "https://www.linkedin.com/in/alexisramundo-dev/",
  },
  {
    image: "/team-martin.jpg",
    name: "Martín Toledano",
    role: "CFO y cofundador",
    bio: "Técnico electrónico e ingeniero industrial. Modelo de negocio y precios.",
    linkedin: "https://www.linkedin.com/in/martin-toledano-804a69264/",
  },
];

export function TeamBlock() {
  return (
    <ul className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4 lg:gap-x-8">
      {teamMembers.map((m) => (
        <li key={m.name} className="group min-w-0">
          <div className="relative aspect-[4/5] overflow-hidden bg-ink/10">
            <Image
              src={m.image}
              alt={`${m.name}, ${m.role}`}
              fill
              sizes="(max-width: 1024px) 46vw, 270px"
              loading="lazy"
              className="object-cover object-[50%_20%] grayscale transition-[filter] duration-500 group-focus-within:grayscale-0 group-hover:grayscale-0"
            />
          </div>
          <h3 className="mt-4 font-serif text-2xl leading-tight">{m.name}</h3>
          <p className="t-small mt-1 font-semibold text-brand">{m.role}</p>
          <p className="t-small mt-2 text-ink/75">{m.bio}</p>
          <a
            href={m.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="t-small mt-2 inline-block py-1 underline underline-offset-4 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            LinkedIn de {m.name.split(" ")[0]}
            <span className="sr-only"> (abre en pestaña nueva)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
