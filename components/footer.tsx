import PushpinTearFooter from "@/components/ui/pushpin-tear-footer";
import { SentinelEmblem } from "@/components/sentinel-logo";
import { CONTACT_FALLBACK_EMAIL } from "@/lib/contact";

// Una sola foto rasgada: la hoja de arriba muestra el fuego y el papel de abajo, el guanaco tomando agua.
// Los links son los mismos que tenía el footer anterior (producto, Sentinel y legal).
// No hay newsletter: el sitio no tiene a dónde mandar esas altas.
export function Footer() {
  return (
    <PushpinTearFooter
      brand="sentinel."
      name="Sentinel Technologies"
      logo={<SentinelEmblem className="size-11" />}
      logoHref="/"
      email={CONTACT_FALLBACK_EMAIL}
      newsletter={null}
      status={{ label: "piloto abierto, escribinos", href: "/#contacto" }}
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
          title: "producto",
          links: [
            { label: "Cómo funciona", href: "/#plataforma" },
            { label: "Simulador", href: "/simulador" },
            { label: "Metodología", href: "/metodologia" },
          ],
          cta: { label: "piloto.", href: "/#contacto" },
        },
        {
          title: "sentinel",
          links: [
            { label: "Equipo", href: "/#equipo" },
            { label: "Blog", href: "/blog" },
            { label: "Contacto", href: "/#contacto" },
          ],
          cta: { label: "hablemos.", href: `mailto:${CONTACT_FALLBACK_EMAIL}` },
        },
      ]}
      chat={{ label: "escribinos", href: "/#contacto" }}
      sideLinks={[
        { icon: "shield", label: "privacidad", href: "/privacidad" },
        { icon: "doc", label: "créditos", href: "/creditos" },
      ]}
      copyright={`© ${new Date().getFullYear()} Sentinel`}
      credit={
        <a
          href="https://se7en.com.ar"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-[0.7em]"
        >
          Creado por
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/se7en-logo.webp" alt="Se7en Dev" width={160} height={45} />
          <span className="sr-only"> (se abre en una pestaña nueva)</span>
        </a>
      }
      handle={{
        label: "@sentinel.arg",
        href: "https://instagram.com/sentinel.arg",
      }}
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
