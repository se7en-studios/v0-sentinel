import PushpinTearFooter from "@/components/ui/pushpin-tear-footer";
import { SentinelEmblem } from "@/components/sentinel-logo";
import { CONTACT_FALLBACK_EMAIL } from "@/lib/contact";
import { getLang, homePath, t, type Copy } from "@/lib/i18n";

const COPY: Copy<{
  status: string;
  productTitle: string;
  how: string;
  simulator: string;
  methodology: string;
  productCta: string;
  sentinelTitle: string;
  team: string;
  blog: string;
  contact: string;
  sentinelCta: string;
  chat: string;
  privacy: string;
  credits: string;
  createdBy: string;
  newTab: string;
  labels: {
    top: string;
    copyEmail: string;
    copyEmailTitle: string;
    copied: string;
    checkEmail: string;
    localTime: string;
    repin: string;
    repinTitle: string;
  };
}> = {
  es: {
    status: "piloto abierto, escribinos",
    productTitle: "producto",
    how: "Cómo funciona",
    simulator: "Simulador",
    methodology: "Metodología",
    productCta: "piloto.",
    sentinelTitle: "sentinel",
    team: "Equipo",
    blog: "Blog",
    contact: "Contacto",
    sentinelCta: "hablemos.",
    chat: "escribinos",
    privacy: "privacidad",
    credits: "créditos",
    createdBy: "Creado por",
    newTab: " (se abre en una pestaña nueva)",
    labels: {
      top: "Volver arriba",
      copyEmail: "Copiar",
      copyEmailTitle: "Copiar email",
      copied: "email copiado",
      checkEmail: "revisá el email",
      localTime: "Hora local",
      repin: "Sacar la chinche y rasgar un borde nuevo",
      repinTitle: "Sacar la chinche",
    },
  },
  en: {
    status: "pilot open, write to us",
    productTitle: "product",
    how: "How it works",
    simulator: "Simulator",
    methodology: "Methodology",
    productCta: "pilot.",
    sentinelTitle: "sentinel",
    team: "Team",
    blog: "Blog",
    contact: "Contact",
    sentinelCta: "let's talk.",
    chat: "write to us",
    privacy: "privacy",
    credits: "credits",
    createdBy: "Created by",
    newTab: " (opens in a new tab)",
    labels: {
      top: "Back to top",
      copyEmail: "Copy",
      copyEmailTitle: "Copy email",
      copied: "email copied",
      checkEmail: "check the email",
      localTime: "Local time",
      repin: "Pull out the pushpin and tear a new edge",
      repinTitle: "Pull out the pushpin",
    },
  },
};

// Una sola foto rasgada: la hoja de arriba muestra el fuego y el papel de abajo, el guanaco tomando agua.
// Los links son los mismos que tenía el footer anterior (producto, Sentinel y legal).
// No hay newsletter: el sitio no tiene a dónde mandar esas altas.
export function Footer() {
  const c = t(COPY);
  const home = (hash: string) => homePath(getLang(), hash);
  return (
    <PushpinTearFooter
      brand="sentinel."
      name="Sentinel Technologies"
      logo={<SentinelEmblem className="size-11" />}
      logoHref={homePath(getLang())}
      email={CONTACT_FALLBACK_EMAIL}
      newsletter={null}
      status={{ label: c.status, href: home("#contacto") }}
      mark="Argentina"
      timeZone="America/Argentina/Buenos_Aires"
      timeLabel="ART"
      socials={[
        {
          icon: "ig",
          label: "Instagram",
          href: "https://instagram.com/sentinel.arg",
        },
        {
          icon: "linkedin",
          label: "LinkedIn",
          href: "https://www.linkedin.com/company/107603300/",
        },
      ]}
      columns={[
        {
          title: c.productTitle,
          links: [
            { label: c.how, href: home("#plataforma") },
            { label: c.simulator, href: "/simulador" },
            { label: c.methodology, href: "/metodologia" },
          ],
          cta: { label: c.productCta, href: home("#contacto") },
        },
        {
          title: c.sentinelTitle,
          links: [
            { label: c.team, href: home("#equipo") },
            { label: c.blog, href: "/blog" },
            { label: c.contact, href: home("#contacto") },
          ],
          cta: { label: c.sentinelCta, href: `mailto:${CONTACT_FALLBACK_EMAIL}` },
        },
      ]}
      chat={{ label: c.chat, href: home("#contacto") }}
      sideLinks={[
        { icon: "shield", label: c.privacy, href: "/privacidad" },
        { icon: "doc", label: c.credits, href: "/creditos" },
      ]}
      copyright={`© ${new Date().getFullYear()} Sentinel`}
      credit={
        <a
          href="https://se7en.com.ar"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-[0.7em]"
        >
          {c.createdBy}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/se7en-logo.webp" alt="Se7en Dev" width={160} height={45} />
          <span className="sr-only">{c.newTab}</span>
        </a>
      }
      handle={{
        label: "@sentinel.arg",
        href: "https://instagram.com/sentinel.arg",
      }}
      labels={c.labels}
      sheet="#d8431a"
      sheetGradient={["#5c1408", "#a82a0c", "#e0501a", "#ff9a2e"]}
      rim="#f4efe3"
      paperImage="/photos/lago-cielo-en-llamas.webp"
      sheetImage="/photos/lago-cielo-en-llamas.webp"
      paperImageCover
      sheetInk="#fff6ec"
      paper="#0b1f16"
      paperInk="#e3f6dc"
      fontSans="var(--font-geist), system-ui, sans-serif"
      height="100svh"
    />
  );
}
