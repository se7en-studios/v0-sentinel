import AxeBuilder from "@axe-core/playwright";
import { appendFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { openTab } from "./tab";

// WCAG 2.2 AA over every admin tab (demo mode), light/dark, phone and desktop.
// Fails on serious/critical; moderate/minor are only logged.
// [full label (desktop), short label (< lg)]
const TABS: [string, string][] = [
  ["Vista general", "General"],
  ["Incendios", "Incendios"],
  ["Zonas", "Zonas"],
  ["Drones y sensores", "Drones"],
  ["Recursos", "Recursos"],
  ["Pronóstico", "Riesgo"],
  ["Incidentes", "Incidentes"],
  ["Métricas", "Métricas"],
  ["Configuración", "Config"],
];
const SIZES = [
  { name: "390", width: 390, height: 844 },
  { name: "1440", width: 1440, height: 800 },
];
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
// Third-party content we do not control: MapLibre canvas and its attribution control.
const EXCLUDE = [".maplibregl-canvas", ".maplibregl-ctrl-attrib"];

async function openAdmin(page: Page, dark: boolean) {
  await page.addInitScript((d) => {
    try {
      localStorage.clear();
      localStorage.setItem("sentinel-admin-theme", d ? "dark" : "light");
    } catch {}
  }, dark);
  await page.goto("/admin");
  await expect(page.getByRole("navigation", { name: "Modos" })).toBeVisible();
}

for (const size of SIZES) {
  for (const dark of [false, true]) {
    test(`a11y axe ${size.name}px ${dark ? "oscuro" : "claro"}`, async ({ page }) => {
      test.setTimeout(240_000);
      await page.setViewportSize({ width: size.width, height: size.height });
      // deterministic: no entrance fades while axe samples colours (also exercises the reduced-motion CSS)
      await page.emulateMedia({ reducedMotion: "reduce" });
      await openAdmin(page, dark);
      await page.getByRole("button", { name: "O probá con datos de ejemplo" }).click().catch(() => {});
      const failures: string[] = [];
      for (const [full, short] of TABS) {
        const tab = full;
        // the strip shows short labels on narrow screens, the "Más" menu always the full one
        await openTab(page, new RegExp(`^(${full}|${short})`));
        await page.waitForTimeout(800);
        const { violations } = await new AxeBuilder({ page })
          .withTags(TAGS)
          .exclude(EXCLUDE[0])
          .exclude(EXCLUDE[1])
          .analyze();
        for (const v of violations) {
          const line = `[${tab}] ${v.impact} ${v.id} x${v.nodes.length}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ") + " " + (n.any[0]?.message ?? n.all[0]?.message ?? "").slice(0, 160)).join(" | ")}`;
          if (v.impact === "serious" || v.impact === "critical") failures.push(line);
          else if (process.env.A11Y_LOG) appendFileSync(process.env.A11Y_LOG, `${size.name} ${dark ? "dark" : "light"} ${line}
`);
        }
      }
      expect(failures, failures.join("\n")).toEqual([]);
    });
  }
}

// Overlays: command palette and shortcuts help must pass axe and keep Tab inside the dialog.
for (const [name, press] of [
  ["paleta de comandos", (p: Page) => p.keyboard.press("Control+k")],
  ["ayuda de atajos", (p: Page) => p.keyboard.press("Shift+?")],
] as const) {
  test(`a11y diálogo ${name}`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openAdmin(page, false);
    await press(page);
    const dlg = page.getByRole("dialog");
    await expect(dlg).toBeVisible();
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
    }
    const { violations } = await new AxeBuilder({ page }).withTags(TAGS).include('[role="dialog"]').analyze();
    expect(violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
  });
}
