const RETRY_MS = 100;
const MAX_TRIES = 30;

/** The sources card sits in Metrics behind its data gate: wait for it to mount, then scroll and open the licenses. */
export function scrollToSources() {
  let tries = 0;
  const go = () => {
    const card = document.getElementById("fuentes");
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "start" });
      card.querySelector("details")?.setAttribute("open", "");
    } else if (tries++ < MAX_TRIES) setTimeout(go, RETRY_MS);
  };
  go();
}
