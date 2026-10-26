import { expect, type Page } from "@playwright/test";

const nav = (page: Page) => page.getByRole("navigation", { name: "Modos" });

/** The mode button when it fits in the strip; otherwise it lives in the "Más" menu. */
export const tab = (page: Page, name: string | RegExp) => nav(page).getByRole("button", { name });

// A click waits for the button to be visible, enabled and stable. On a busy CI runner (software WebGL
// for the map, dev server compiling) that check alone can take longer than 2 s, so a short limit made
// every retry fail the same way. Long enough for a slow page, short enough to retry when a tab hops.
const CLICK_MS = 8000;

/**
 * Opens a mode wherever the strip put it (visible button or "Más" menu). The strip re-measures
 * after layout changes, so a tab can hop between the two while we look: retry the whole step.
 */
export async function openTab(page: Page, name: string | RegExp) {
  await expect(async () => {
    const btn = tab(page, name);
    if (await btn.isVisible()) return btn.click({ timeout: CLICK_MS });
    await nav(page).getByRole("button", { name: "Más" }).click({ timeout: CLICK_MS });
    // an open menu hides the rest of the page from the accessibility tree: close it before retrying
    await page.getByRole("menuitem", { name }).click({ timeout: CLICK_MS }).catch(async (e) => {
      await page.keyboard.press("Escape");
      throw e;
    });
  }).toPass({ timeout: 45_000 });
}
