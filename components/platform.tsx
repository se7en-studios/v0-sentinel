import { Chapter, Eyebrow } from "@/components/ui/chapter";
import { PlatformDemo } from "@/components/platform-demo";

// Apoyo del flujo: lo que rodea a Detectar → Alertar, sin repetirlo.
const SUPPORT = [
  {
    title: "Integración con brigadas",
    text: "Las alertas llegan por los canales que ya usan: WhatsApp y consola web.",
  },
  {
    title: "Reportes y analítica",
    text: "Historial de focos, tiempos de respuesta y zonas recurrentes para planificar la temporada.",
  },
  {
    title: "Cobertura satelital",
    text: "Lectura continua las 24 h sobre la región. Drones y sensores en territorio se suman de forma progresiva.",
  },
];

export function Platform() {
  return (
    <Chapter id="plataforma" tone="dark">
      <Eyebrow tone="dark">La plataforma</Eyebrow>
      <h2 className="t-h2 max-w-3xl">
        Del satélite a la brigada, en cuatro pasos
      </h2>
      <p className="t-lead mt-4 max-w-2xl opacity-80">
        Recorré una alerta de ejemplo: cada paso muestra qué ve Sentinel y qué
        recibe quien tiene que actuar.
      </p>
      <div className="mt-12">
        <PlatformDemo />
      </div>
      <dl className="mt-16 grid gap-8 border-t border-white/15 pt-10 md:grid-cols-3">
        {SUPPORT.map(({ title, text }) => (
          <div key={title}>
            <dt className="t-h3">{title}</dt>
            <dd className="t-body mt-2 opacity-80">{text}</dd>
          </div>
        ))}
      </dl>
    </Chapter>
  );
}
