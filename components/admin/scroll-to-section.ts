const RETRY_MS = 100;
const MAX_TRIES = 30;

/** Scrolls to an element that may not exist yet (the screen renders a moment after the tab changes). */
export function scrollToSection(id: string) {
  let tries = 0;
  const go = () => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    else if (tries++ < MAX_TRIES) setTimeout(go, RETRY_MS);
  };
  go();
}
