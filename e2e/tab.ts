import { expect, type Page } from "@playwright/test";

const nav = (page: Page) => page.getByRole("navigation", { name: "Modos" });

/** The mode button when it fits in the strip; otherwise it lives in the "Más" menu. */
export const tab = (page: Page, name: string | RegExp) => nav(page).getByRole("button", { name });

/**
 * Opens a mode wherever the strip put it (visible button or "Más" menu). The strip re-measures
 * after layout changes, so a tab can hop between the two while we look: retry the whole step.
 */
export async function openTab(page: Page, name: string | RegExp) {
  await expect(async () => {
    const btn = tab(page, name);
    if (await btn.isVisible()) return btn.click({ timeout: 2000 });
    await nav(page).getByRole("button", { name: "Más" }).click({ timeout: 2000 });
    // an open menu hides the rest of the page from the accessibility tree: close it before retrying
    await page.getByRole("menuitem", { name }).click({ timeout: 2000 }).catch(async (e) => {
      await page.keyboard.press("Escape");
      throw e;
    });
  }).toPass({ timeout: 15_000 });
}
