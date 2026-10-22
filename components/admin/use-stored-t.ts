"use client";

import { useCallback, useEffect, useState } from "react";
import { parseLocale, translate, type Locale, type Translate } from "@/lib/admin/i18n";

const KEY = "sentinel-admin-locale";

/** Remembers the interface language so screens that open before the workspace loads (login, shared links) match it. */
export const storeLocale = (locale: Locale) => {
  try {
    localStorage.setItem(KEY, locale);
  } catch {
    /* private mode: those screens just stay in Spanish */
  }
};

export function useStoredT(): { t: Translate; locale: Locale } {
  const [locale, setLocale] = useState<Locale>("es");
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after hydration
      setLocale(parseLocale(localStorage.getItem(KEY)));
    } catch {
      /* stays in Spanish */
    }
  }, []);
  const t = useCallback<Translate>((key, vars) => translate(locale, key, vars), [locale]);
  return { t, locale };
}
