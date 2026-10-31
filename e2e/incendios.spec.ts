import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

// Smoke test of the "Incendios" tab. The reconstructed case (Puerto Patriada) is a static package in
// public/data, so nothing here depends on FIRMS or any third-party API answering.

test("el enlace directo abre Incendios y el caso reconstruido carga", async ({
  page,
}) => {
  const failures: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" && m.text().includes('[admin] "'))
      failures.push(m.text());
  });
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      localStorage.setItem("sentinel-admin-workspace-v1", '{"settings":{"onboarded":true}}'); // first-run question already answered
    } catch {
      /* private mode */
    }
  });
  await page.goto("/admin?tab=incendios");
  await expect(page.getByRole("navigation", { name: "Modos" })).toBeVisible();
  // the panel offers both sources; the live one needs FIRMS, the case does not
  await expect(page.getByText("En vivo · Argentina").first()).toBeVisible();
  await page.getByText("Caso: Puerto Patriada").first().click();
  await expect(page.getByText(/Puerto Patriada/).first()).toBeVisible();
  await expect(page.locator("canvas.maplibregl-canvas")).toBeVisible();
  expect(failures).toEqual([]);
});

// Without live data the tab shows the last saved copy and says so. That state only appears when the live
// feed fails (always on a CI runner without network), so it needs its own check: it once slipped through the colour contrast.
test("sin datos en vivo avisa con palabras simples y cumple el contraste", async ({ page }) => {
  await page.route("**/api/admin/live", (r) => r.fulfill({ status: 502, json: { error: "x" } }));
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      localStorage.setItem("sentinel-admin-workspace-v1", '{"settings":{"onboarded":true}}'); // first-run question already answered
    } catch {
      /* private mode */
    }
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/admin?tab=incendios");
  await expect(page.getByText(/No pudimos traer los datos en vivo/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/última copia guardada/).first()).toBeVisible();
  const { violations } = await new AxeBuilder({ page })
    .withRules(["color-contrast"])
    .exclude(".maplibregl-canvas")
    .exclude(".maplibregl-ctrl-attrib")
    .analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
});
