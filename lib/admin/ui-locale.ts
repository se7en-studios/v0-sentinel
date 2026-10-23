import { translate, type Locale, type MsgKey } from "./i18n";
import { NUM_LOCALE } from "./i18n-shell";

/**
 * The interface language for code that lives outside React (map popups, live drawing text).
 * The panel keeps it in step with the setting (see use-admin); Spanish until then.
 */
let current: Locale = "es";

export const setUiLocale = (l: Locale) => {
  current = l;
};
export const uiLocale = (): Locale => current;
/** BCP 47 tag for numbers and dates in the current language. */
export const uiLoc = () => NUM_LOCALE[current];
export const uiT = (key: MsgKey, vars?: Record<string, string | number>) =>
  translate(current, key, vars);
