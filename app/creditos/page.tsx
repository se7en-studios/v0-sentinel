import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PHOTOS } from "@/lib/photos";

export const metadata: Metadata = {
  title: "Créditos de imágenes",
  description:
    "Autores, licencias y fuentes de las fotos de incendios y de las imágenes satelitales que se muestran en la web de Sentinel.",
  alternates: { canonical: "/creditos" },
};

// Cada foto con crédito, licencia y enlace a la fuente original (exigido por CC BY-SA y por Copernicus).
const ITEMS = Object.entries(PHOTOS).filter(([, p]) => "credit" in p && p.credit) as [
  string,
  (typeof PHOTOS)[keyof typeof PHOTOS] & { credit: { author: string; license: string; licenseUrl?: string; source: string } },
][];

export default function CreditosPage() {
  return (
    <>
      <header>
        <Navbar />
      </header>
      <main id="main-content" className="a-root min-h-screen px-5 pb-24 pt-32 md:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="a-title !text-left">Créditos de imágenes</h1>
          <p className="a-sub mt-5">
            Las fotos de incendios de esta web son de fotógrafos que las publicaron con licencias libres en Wikimedia Commons, y las
            imágenes satelitales son de la NASA y del programa europeo Copernicus. Las recortamos y las comprimimos para la web. Gracias
            a quienes las hicieron.
          </p>
          <ul className="mt-12 divide-y divide-a-line border-y border-a-line">
            {ITEMS.map(([slot, p]) => (
              <li key={slot} className="grid gap-1 py-5 sm:grid-cols-[1fr_auto] sm:gap-6">
                <div className="min-w-0">
                  <p className="font-medium text-[#e3f6dc]">{p.caption}</p>
                  <p className="mt-1 text-sm text-a-mute">{p.credit.author}</p>
                </div>
                <p className="text-sm text-a-mute sm:text-right">
                  {p.credit.licenseUrl ? (
                    <a className="underline underline-offset-4 hover:text-[#e3f6dc]" href={p.credit.licenseUrl} rel="noopener noreferrer">
                      {p.credit.license}
                    </a>
                  ) : (
                    p.credit.license
                  )}
                  {" · "}
                  <a className="underline underline-offset-4 hover:text-[#e3f6dc]" href={p.credit.source} rel="noopener noreferrer">
                    fuente
                  </a>
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-sm text-a-faint">
            Imágenes de Copernicus: contienen datos Copernicus Sentinel modificados. Las fotos con licencia CC BY-SA 4.0 se comparten bajo
            la misma licencia (recortes y compresión incluidos).
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
