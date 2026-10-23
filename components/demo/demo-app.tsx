"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type TouchEvent,
} from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Moon, Sun } from "lucide-react";
import {
  DEMO_LOCALES,
  demoTranslator,
  parseDemoLocale,
  type DemoKey,
  type DemoLocale,
} from "@/lib/admin/i18n-demo";
import type { CountryGeo } from "@/lib/demo/geo";
import type { DemoGeo } from "./map";
import { SceneEarly } from "./scene-early";
import { SceneFilter } from "./scene-filter";
import { SceneHeat } from "./scene-heat";
import { SceneIncident } from "./scene-incident";
import { SceneUseCases } from "./scene-usecases";
import { SceneZone } from "./scene-zone";
import "@/app/demo/demo.css";

const NAV_KEYS: DemoKey[] = [
  "s1.nav",
  "s2.nav",
  "s3.nav",
  "s4.nav",
  "s5.nav",
  "s6.nav",
];
const TOTAL = NAV_KEYS.length;
const LOCALE_KEY = "sentinel-demo-locale";
const THEME_KEY = "sentinel-demo-theme";
const SWIPE_PX = 60;

type Theme = "light" | "dark";

const store = (fn: () => string | null) => {
  try {
    return fn();
  } catch {
    return null;
  }
};

const subscribeScheme = (cb: () => void) => {
  const m = window.matchMedia("(prefers-color-scheme: dark)");
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
const systemDark = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const stepFromHash = () => {
  const n = Number(window.location.hash.slice(1));
  return Number.isInteger(n) && n >= 1 && n <= TOTAL ? n - 1 : 0;
};

const isFormField = (el: EventTarget | null) =>
  el instanceof HTMLElement && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName);

export function DemoApp({
  geo,
  rings,
}: {
  geo: DemoGeo;
  rings: CountryGeo["rings"];
}) {
  const [step, setStep] = useState(0);
  const [locale, setLocale] = useState<DemoLocale>("es");
  const [theme, setTheme] = useState<Theme | null>(null);
  const prefersDark = useSyncExternalStore(
    subscribeScheme,
    systemDark,
    () => false,
  );
  const moved = useRef(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const t = demoTranslator(locale);
  const dark = (theme ?? (prefersDark ? "dark" : "light")) === "dark";

  // Saved choices and the step in the URL are only readable after hydration.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setLocale(parseDemoLocale(store(() => localStorage.getItem(LOCALE_KEY))));
    const th = store(() => localStorage.getItem(THEME_KEY));
    if (th === "light" || th === "dark") setTheme(th);
    setStep(stepFromHash());
    /* eslint-enable react-hooks/set-state-in-effect */
    const onHash = () => setStep(stepFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const prev = document.documentElement.lang;
    document.documentElement.lang = locale;
    return () => {
      document.documentElement.lang = prev;
    };
  }, [locale]);

  const go = useCallback((n: number) => {
    const next = Math.min(TOTAL - 1, Math.max(0, n));
    moved.current = true;
    setStep(next);
    window.history.replaceState(null, "", `#${next + 1}`);
  }, []);

  // After the user moves, bring the new title into view and to the screen reader.
  useEffect(() => {
    if (!moved.current) return;
    window.scrollTo({ top: 0 });
    document.getElementById("demo-title")?.focus({ preventScroll: true });
  }, [step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.defaultPrevented ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        isFormField(e.target)
      )
        return;
      const fwd = e.key === "ArrowRight" || e.key === "PageDown";
      const back = e.key === "ArrowLeft" || e.key === "PageUp";
      if (!fwd && !back) return;
      e.preventDefault();
      go(step + (fwd ? 1 : -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, step]);

  const pickLocale = (l: DemoLocale) => {
    setLocale(l);
    store(() => (localStorage.setItem(LOCALE_KEY, l), null));
  };
  const toggleTheme = () => {
    const next: Theme = dark ? "light" : "dark";
    setTheme(next);
    store(() => (localStorage.setItem(THEME_KEY, next), null));
  };

  const onTouchStart = (e: TouchEvent) => {
    const p = e.changedTouches[0];
    touch.current = { x: p.clientX, y: p.clientY };
  };
  const onTouchEnd = (e: TouchEvent) => {
    const s = touch.current;
    touch.current = null;
    if (!s) return;
    const dx = e.changedTouches[0].clientX - s.x;
    const dy = e.changedTouches[0].clientY - s.y;
    if (Math.abs(dx) >= SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.5)
      go(step + (dx < 0 ? 1 : -1));
  };

  const scene = [
    <SceneHeat key="1" t={t} geo={geo} />,
    <SceneFilter key="2" t={t} geo={geo} />,
    <SceneEarly key="3" t={t} geo={geo} />,
    <SceneZone key="4" t={t} geo={geo} rings={rings} />,
    <SceneIncident key="5" t={t} />,
    <SceneUseCases key="6" t={t} restart={() => go(0)} />,
  ][step];

  return (
    <div className="demo" data-theme={theme ?? undefined}>
      <header className="d-header">
        <Link href="/" className="d-brand" aria-label={t("chrome.site")}>
          SENTINEL
        </Link>
        <div className="d-tools">
          <div role="group" aria-label={t("chrome.lang")} className="d-lang">
            {DEMO_LOCALES.map((l) => (
              <button
                key={l.id}
                type="button"
                lang={l.id}
                aria-pressed={locale === l.id}
                aria-label={l.label}
                onClick={() => pickLocale(l.id)}
              >
                {l.short}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="d-icon-btn"
            onClick={toggleTheme}
            aria-label={dark ? t("chrome.themeLight") : t("chrome.themeDark")}
          >
            {dark ? (
              <Sun aria-hidden className="size-5" />
            ) : (
              <Moon aria-hidden className="size-5" />
            )}
          </button>
        </div>
      </header>

      <nav aria-label={t("chrome.steps")} className="d-steps">
        <div
          role="progressbar"
          aria-label={t("chrome.progress")}
          aria-valuemin={1}
          aria-valuemax={TOTAL}
          aria-valuenow={step + 1}
          aria-valuetext={t("chrome.step", { n: step + 1, total: TOTAL })}
          className="d-progress"
        >
          <span style={{ width: `${((step + 1) / TOTAL) * 100}%` }} />
        </div>
        <ol>
          {NAV_KEYS.map((k, i) => (
            <li key={k}>
              <button
                type="button"
                aria-current={i === step ? "step" : undefined}
                data-done={i <= step}
                onClick={() => go(i)}
              >
                <span className="d-step-n">{i + 1}</span>
                <span className="d-step-t">{t(k)}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <main
        id="main-content"
        className="d-main"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {scene}
      </main>

      <footer className="d-footer">
        <button
          type="button"
          className="d-btn d-btn--ghost"
          onClick={() => go(step - 1)}
          disabled={step === 0}
        >
          <ChevronLeft aria-hidden className="size-6" />
          {t("chrome.prev")}
        </button>
        <p className="d-hint">
          <span className="d-hint-step">
            {t("chrome.step", { n: step + 1, total: TOTAL })}
          </span>
          <span className="d-hint-keys">{t("chrome.hint")}</span>
        </p>
        <button
          type="button"
          className="d-btn"
          onClick={() => go(step + 1)}
          disabled={step === TOTAL - 1}
        >
          {t("chrome.next")}
          <ChevronRight aria-hidden className="size-6" />
        </button>
      </footer>
    </div>
  );
}
