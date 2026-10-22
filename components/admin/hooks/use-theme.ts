import { useEffect, useState } from "react";

const THEME_KEY = "sentinel-admin-theme";

/** Light/dark preference, persisted in localStorage. */
export function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    try {
      const v = localStorage.getItem(THEME_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after hydration
      if (v) setDark(v === "dark");
    } catch {}
  }, []);
  const toggleTheme = () =>
    setDark((d) => {
      try {
        localStorage.setItem(THEME_KEY, d ? "light" : "dark");
      } catch {}
      return !d;
    });
  return { dark, toggleTheme };
}
