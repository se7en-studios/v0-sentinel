import {
  PerspectiveTunnel,
  type TunnelItem,
} from "@/components/ui/perspective-tunnel";
import { t, type Copy } from "@/lib/i18n";

// Fotos propias del equipo. Los títulos describen la escena y no afirman nada sobre lugar o fecha.
const ITEMS: { src: string; title: Copy<string>; alt: Copy<string> }[] = [
  {
    src: "/photos/ambiente-bomberos.webp",
    title: { es: "Brigada", en: "Brigade" },
    alt: { es: "Bomberos voluntarios frente a un incendio forestal", en: "Volunteer firefighters facing a wildfire" },
  },
  {
    src: "/photos/ambiente-montana-atardecer.webp",
    title: { es: "Cordillera", en: "The Andes" },
    alt: { es: "Roca y bosque de pinos al atardecer", en: "Rock and pine forest at sunset" },
  },
  {
    src: "/photos/hero-incendio-noche.webp",
    title: { es: "Noche de incendio", en: "Fire at night" },
    alt: { es: "Humo y llamas naranjas detrás de una arboleda, de noche", en: "Smoke and orange flames behind a grove of trees, at night" },
  },
  {
    src: "/photos/ambiente-guanaco-roca.webp",
    title: { es: "Guanaco", en: "Guanaco" },
    alt: { es: "Un guanaco sobre las rocas de la estepa", en: "A guanaco on the rocks of the steppe" },
  },
  {
    src: "/photos/ambiente-bombera-humo.webp",
    title: { es: "Entre el humo", en: "In the smoke" },
    alt: { es: "Una bombera junto a un pastizal con humo", en: "A firefighter next to a smoking grassland" },
  },
  {
    src: "/photos/ambiente-bosque-lenga.webp",
    title: { es: "Bosque de lengas", en: "Lenga forest" },
    alt: { es: "Troncos de un bosque de lengas", en: "Trunks in a lenga forest" },
  },
  {
    src: "/photos/lago-cielo-en-llamas.webp",
    title: { es: "El lago", en: "The lake" },
    alt: { es: "Un guanaco toma agua frente a una ladera en llamas", en: "A guanaco drinks water in front of a burning hillside" },
  },
  {
    src: "/photos/ambiente-brasas.webp",
    title: { es: "Brasas", en: "Embers" },
    alt: { es: "Brasas sobre el suelo del bosque", en: "Embers on the forest floor" },
  },
  {
    src: "/photos/ambiente-bosque-quemado.webp",
    title: { es: "Después del fuego", en: "After the fire" },
    alt: { es: "Troncos oscuros entre el humo de un bosque quemado", en: "Dark trunks in the smoke of a burned forest" },
  },
];

const COPY: Copy<{ eyebrow: string; line1: string; line2: string; hint: string }> = {
  es: { eyebrow: "Lo que está en juego", line1: "El bosque,", line2: "antes que el fuego.", hint: "Seguí bajando" },
  en: { eyebrow: "What is at stake", line1: "The forest,", line2: "before the fire.", hint: "Keep scrolling" },
};

export function Tunnel() {
  const c = t(COPY);
  const items: TunnelItem[] = ITEMS.map((i) => ({ src: i.src, title: t(i.title), alt: t(i.alt) }));
  return (
    <PerspectiveTunnel
      items={items}
      eyebrow={c.eyebrow}
      title={
        <>
          {c.line1}
          <br />
          <span className="a-em">{c.line2}</span>
        </>
      }
      hint={c.hint}
    />
  );
}
