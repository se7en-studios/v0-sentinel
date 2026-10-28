import { FaqScroller } from "@/components/ui/faq-scroller";
import { CLAIMS } from "@/lib/claims";
import { t, type Copy } from "@/lib/i18n";

const COPY: Copy<{ title: string; faqs: { question: string; answer: string }[] }> = {
  es: {
    title: "Preguntas frecuentes",
    faqs: [
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
    ],
  },
  en: {
    title: "Frequently asked questions",
    faqs: [
      {
        question: "How does Sentinel Cloud work?",
        answer: `We read satellite data (${CLAIMS.satellites}) and combine it with geospatial information and artificial intelligence to flag likely fire hotspots and send a geolocated alert. Our accuracy target is ${CLAIMS.accuracyPct}%: it is a goal, not yet a result measured in the field. Today the reading is satellite-based; we are adding sensors and drones step by step.`,
      },
      {
        question: "What if the AI gets it wrong and raises a false alarm?",
        answer: `It can happen, and it is the first question any fire brigade asks: a false alert costs time and resources. That is why the model cross-checks several sources before alerting, and that is the basis of our ${CLAIMS.accuracyPct}% accuracy target, which we must validate in pilots together with each client.`,
      },
      {
        question: "How much does it cost to implement Sentinel?",
        answer:
          "There is no upfront investment in equipment (CAPEX): the model points to a Sentinel Cloud subscription over the coverage you need. The price is defined according to the territory. We start with a limited pilot to validate results before a larger contract.",
      },
      {
        question: "How long until it is operational in my territory?",
        answer:
          "Our goal for a pilot is to generate alerts within 4 to 8 weeks of the start (internal estimate, to be confirmed depending on the territory). The platform is cloud-based: there is no construction or infrastructure to install on your side, you only need to define the area to cover and have internet access.",
      },
      {
        question: "Is the live data on the website from the Sentinel network?",
        answer:
          "No, and we want to be clear: the risk index and the hotspot map use public sources (Open-Meteo and NASA FIRMS) for illustration, to show the same kind of variables our system processes. A client's deployment data is not public and is not shown on the website.",
      },
    ],
  },
};

const faqJsonLd = (faqs: { question: string; answer: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
});

export function FAQ() {
  const { title, faqs } = t(COPY);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }}
      />
      <FaqScroller title={title} items={faqs} />
    </>
  );
}
