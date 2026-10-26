import { chromium, type FullConfig } from "@playwright/test";
import { skipFirstRun } from "./fixtures";

// `next dev` compiles each view the first time the browser asks for it (10-40 s on a cold start), which
// made the first test to touch a view time out. Walking every view once here pays that cost up front,
// outside any test's clock. Best effort: if warming fails, the tests still run (and just take longer).
const VIEWS = ["Pronóstico", "Incidentes", "Métricas", "Configuración"];

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL ?? "http://localhost:3123";
  const browser = await chromium.launch({ channel: "chrome" });
  try {
    const page = await browser.newPage({ baseURL });
    page.setDefaultTimeout(120_000);
    await skipFirstRun(page);
    await page.goto("/admin");
    const nav = page.getByRole("navigation", { name: "Modos" });
    await nav.waitFor();
    for (const name of VIEWS) {
      // the 1280 px default viewport pushes the last modes into the "Más" menu
      const btn = nav.getByRole("button", { name });
      if (await btn.isVisible()) await btn.click();
      else {
        await nav.getByRole("button", { name: "Más" }).click();
        await page.getByRole("menuitem", { name }).click();
      }
      await page.getByRole("heading", { level: 1 }).first().waitFor();
    }
  } catch (e) {
    console.warn("[e2e] precalentamiento incompleto:", (e as Error).message);
  } finally {
    await browser.close();
  }
}
