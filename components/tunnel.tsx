import {
  PerspectiveTunnel,
  type TunnelItem,
} from "@/components/ui/perspective-tunnel";

// Fotos propias del equipo. Los títulos describen la escena y no afirman nada sobre lugar o fecha.
const ITEMS: TunnelItem[] = [
  {
    src: "/photos/ambiente-bomberos.webp",
    title: "Brigada",
    alt: "Bomberos voluntarios frente a un incendio forestal",
  },
  {
    src: "/photos/ambiente-montana-atardecer.webp",
    title: "Cordillera",
    alt: "Roca y bosque de pinos al atardecer",
  },
  {
    src: "/photos/hero-incendio-noche.webp",
    title: "Noche de incendio",
    alt: "Humo y llamas naranjas detrás de una arboleda, de noche",
  },
  {
    src: "/photos/ambiente-guanaco-roca.webp",
    title: "Guanaco",
    alt: "Un guanaco sobre las rocas de la estepa",
  },
  {
    src: "/photos/ambiente-bombera-humo.webp",
    title: "Entre el humo",
    alt: "Una bombera junto a un pastizal con humo",
  },
  {
    src: "/photos/ambiente-bosque-lenga.webp",
    title: "Bosque de lengas",
    alt: "Troncos de un bosque de lengas",
  },
  {
    src: "/photos/lago-cielo-en-llamas.webp",
    title: "El lago",
    alt: "Un guanaco toma agua frente a una ladera en llamas",
  },
  {
    src: "/photos/ambiente-brasas.webp",
    title: "Brasas",
    alt: "Brasas sobre el suelo del bosque",
  },
  {
    src: "/photos/ambiente-bosque-quemado.webp",
    title: "Después del fuego",
    alt: "Troncos oscuros entre el humo de un bosque quemado",
  },
];

export function Tunnel() {
  return (
    <PerspectiveTunnel
      items={ITEMS}
      eyebrow="Lo que está en juego"
      title={
        <>
          El bosque,
          <br />
          <span className="a-em">antes que el fuego.</span>
        </>
      }
      hint="Seguí bajando"
    />
  );
}
