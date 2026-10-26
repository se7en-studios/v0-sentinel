import { FaqSectionWithCategories } from "@/components/blocks/faq-with-categories";
import { CLAIMS } from "@/lib/claims";

const faqs = [
  {
    question: "¿Cómo funciona Sentinel Cloud?",
    answer: `Cruzamos datos satelitales (${CLAIMS.satellites}) con información del terreno y un modelo de inteligencia artificial para marcar focos de calor probables, y mandamos una alerta con la ubicación estimada. Apuntamos a una precisión del ${CLAIMS.accuracyPct}%, pero es una meta de diseño: todavía no la medimos en campo. Los sensores y los drones se suman de a poco.`,
  },
  {
    question: "¿Y si la IA se equivoca y salta una falsa alarma?",
    answer: `Puede pasar, y es la primera pregunta que nos hace cualquier brigada: una alarma falsa cuesta tiempo y gente. Por eso el modelo contrasta varias fuentes antes de avisar. Esa es la base de la meta del ${CLAIMS.accuracyPct}% de precisión, que tenemos que validar en pilotos junto a cada cliente.`,
  },
  {
    question: "¿Cuánto cuesta?",
    answer:
      "No hay inversión inicial en equipos. El modelo es una suscripción a Sentinel Cloud según el territorio que quieras cubrir, y el precio depende de esa superficie. Empezamos con un piloto acotado para ver si funciona antes de firmar algo más grande.",
  },
  {
    question: "¿Cuánto tarda en estar andando en mi territorio?",
    answer:
      "Nos proponemos tener alertas en 4 a 8 semanas desde el inicio del piloto. Es una estimación nuestra y puede cambiar según la zona. Es una plataforma en la nube: no hay obra ni instalación de tu lado, solo definimos el área y necesitás conexión a internet.",
  },
  {
    question: "¿Hace falta saber de tecnología para usarlo?",
    answer:
      "No. Recibís la alerta con la ubicación estimada del foco y decidís vos. Capacitamos a tu equipo al empezar.",
  },
  {
    question: "¿Qué soporte dan?",
    answer: `En cada piloto acordamos el esquema con el cliente. La idea es cubrir operaciones críticas las ${CLAIMS.monitoringHours} horas, con capacitación inicial y actualizaciones del modelo a medida que sumamos datos de tu zona.`,
  },
  {
    question: "¿Para quién es?",
    answer:
      "Para municipios, brigadas de bomberos, empresas forestales, productores agropecuarios y cualquier organización que cuide mucha superficie de terreno.",
  },
  {
    question: "¿Los datos en vivo de esta web son de la red de Sentinel?",
    answer:
      "No. El índice de riesgo y el mapa de focos usan fuentes públicas (Open-Meteo y NASA FIRMS) y están ahí para mostrar el tipo de variables que procesamos. Los datos de la implementación de un cliente no son públicos y no se muestran acá.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export function FAQ() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <FaqSectionWithCategories
        title="Lo que nos preguntan seguido"
        items={faqs}
      />
    </>
  );
}
