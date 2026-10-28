import { cache } from "react";

// Idioma de la landing. La home en español vive en "/" y la inglesa en "/en"; el resto del sitio queda en español.
export type Lang = "es" | "en";
export type Copy<T> = Record<Lang, T>;

export const LANGS: readonly Lang[] = ["es", "en"];
export const HTML_LANG: Record<Lang, string> = { es: "es-AR", en: "en" };

// Solo servidor: el idioma de la página en curso vive en un cache de React (uno por request/render).
// La página lo fija con setLang() antes de renderizar los hijos; los componentes de servidor lo leen con t().
// Los componentes de cliente NO deben usar esto: usan useCopy() de "@/lib/i18n/client".
const store = cache(() => ({ lang: "es" as Lang }));
export const setLang = (lang: Lang) => {
  store().lang = lang;
};
export const getLang = (): Lang => store().lang;
export const t = <T,>(copy: Copy<T>): T => copy[getLang()];

// Dirección de la home en cada idioma (con hash opcional).
export const homePath = (lang: Lang, hash = "") => `${lang === "en" ? "/en" : "/"}${hash}`;
