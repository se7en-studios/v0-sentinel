"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { HTML_LANG, type Copy, type Lang } from "@/lib/i18n";

const LangContext = createContext<Lang>("es");

// Envuelve la home: da el idioma a los componentes de cliente y ajusta <html lang> (el layout raíz es compartido).
export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.lang;
    html.lang = HTML_LANG[lang];
    return () => {
      html.lang = prev;
    };
  }, [lang]);
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
export const useCopy = <T,>(copy: Copy<T>): T => copy[useLang()];
