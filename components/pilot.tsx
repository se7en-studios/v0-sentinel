import { ASection, AHeading, riseDelay } from "@/components/a-section";

const PILOT = [
  "4 a 8 semanas hasta las primeras alertas a confirmar (estimación interna, depende del territorio)",
  "Sin inversión inicial en equipos: todo en la nube",
  "Elegimos una zona juntos, la que más te preocupa",
  "Alertas geolocalizadas, acceso al panel y acompañamiento para que tu equipo lo use",
];

const SUSTAINED = [
  "Se define con cada organización, según el territorio y lo que aprendimos en el piloto",
  "Alertas sobre la cobertura acordada",
  "Panel con mapa, historial y riesgo de la zona",
  "Soporte y actualización de los modelos con datos de tu territorio",
];

function PlanCard({
  name,
  lead,
  items,
  className,
  leadClass,
  lineClass,
  from,
}: {
  name: string;
  lead: string;
  items: string[];
  className: string;
  leadClass: string;
  lineClass: string;
  from: "l" | "r";
}) {
  return (
    <div
      className={`a-scale-in pilot-${from} flex min-w-0 flex-col rounded-2xl p-7 md:p-9 ${className}`}
    >
      <h3 className="a-display-m">{name}</h3>
      <p className={`mt-3 text-[0.9375rem] leading-relaxed ${leadClass}`}>
        {lead}
      </p>
      <ul className={`mt-7 border-t ${lineClass}`}>
        {items.map((t, i) => (
          <li
            key={t}
            style={riseDelay(i, 10)}
            className={`a-rise border-b py-3.5 text-[0.9375rem] leading-relaxed ${lineClass}`}
          >
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Sin precios: el modelo se define con cada organización y todavía no hay pilotos cuantificados.
const SIDE_CSS = `@media (prefers-reduced-motion: no-preference){@supports (animation-timeline: view()){
@keyframes pilot-from-l{from{opacity:0;transform:translateX(-56px) scale(.94)}to{opacity:1;transform:none}}
@keyframes pilot-from-r{from{opacity:0;transform:translateX(56px) scale(.94)}to{opacity:1;transform:none}}
.pilot-l{animation-name:pilot-from-l}.pilot-r{animation-name:pilot-from-r}
@media (max-width:767px){.pilot-l,.pilot-r{animation-name:a-scale-in}}}}`;

export function Pilot() {
  return (
    <ASection id="piloto">
      <style>{SIDE_CSS}</style>
      <AHeading
        eyebrow="Cómo empezamos"
        title="Arrancamos chico, en una zona que elijas"
        sub="No hay lista de precios: el valor se arma con cada organización. Preferimos validar primero que las alertas te sirvan."
      />
      <div className="mt-14 grid gap-4 md:grid-cols-2">
        <PlanCard
          name="Piloto"
          lead="Para probar Sentinel en un territorio acotado antes de comprometerse a algo más grande."
          items={PILOT}
          className="a-bone"
          leadClass="text-[#4b5750]"
          lineClass="border-[#131a16]/20"
          from="l"
        />
        <PlanCard
          name="Despliegue sostenido"
          lead="Si el piloto funciona, lo extendemos al resto del territorio."
          items={SUSTAINED}
          className="bg-a-sand text-[#1f1710]"
          leadClass="text-[#3a2e20]"
          lineClass="border-[#1f1710]/25"
          from="r"
        />
      </div>
      <div className="mt-10 text-center">
        <a
          href="#contacto"
          className="a-pill a-rise focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-a-accent"
        >
          Pedir un piloto
        </a>
      </div>
    </ASection>
  );
}
