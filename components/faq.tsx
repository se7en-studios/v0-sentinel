import { FaqSectionWithCategories } from "@/components/blocks/faq-with-categories";
import { CLAIMS } from "@/lib/claims";

const faqs = [
  {
    question: "¿Cómo funciona Sentinel Cloud?",
    answer: `Leemos datos satelitales (${CLAIMS.satellites}), los cruzamos con información geoespacial e inteligencia artificial para marcar focos de calor probables y mandar una alerta geolocalizada. Nuestro objetivo de precisión es ${CLAIMS.accuracyPct}%: es una meta, todavía no un resultado medido en campo. Hoy la lectura es satelital; sensores y drones los sumamos de a poco.`,
  },
  {
    question: "¿Y si la IA se equivoca y salta una falsa alarma?",
    answer: `Puede pasar, y es la primera pregunta de cualquier brigada: una alerta falsa cuesta tiempo y recursos. Por eso el modelo cruza varias fuentes antes de alertar, y esa es la base de nuestro objetivo de precisión del ${CLAIMS.accuracyPct}%, que debemos validar en pilotos junto a cada cliente.`,
  },
  {
    question: "¿Cuánto cuesta implementar Sentinel?",
    answer:
      "No hay inversión inicial en equipos (CAPEX): el modelo apunta a una suscripción a Sentinel Cloud sobre la cobertura que necesitás. El precio se define según el territorio. Arrancamos con un piloto acotado para validar resultados antes de un contrato mayor.",
  },
  {
    question: "¿Cuánto tarda en estar operativo en mi territorio?",
    answer:
      "Nuestra meta para un piloto es generar alertas en 4 a 8 semanas desde el inicio (estimación interna, a confirmar según el territorio). La plataforma es cloud: no hay obra ni infraestructura que instalar de tu lado, solo definir la zona a cubrir y tener acceso a internet.",
  },
  {
    question: "¿Los datos en vivo de la web son de la red de Sentinel?",
    answer:
      "No, y queremos ser claros: el índice de riesgo y el mapa de focos usan fuentes públicas (Open-Meteo y NASA FIRMS) a modo ilustrativo, para mostrar el mismo tipo de variables que procesa nuestro sistema. Los datos de la implementación de un cliente no son públicos ni se muestran en la web.",
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
        title="Preguntas frecuentes"
        items={faqs}
      />
    </>
  );
}
