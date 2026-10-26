import AxeBuilder from "@axe-core/playwright";
import type { Locator } from "@playwright/test";
import { expect, firstRunTest, test, type Page } from "./fixtures";
import { closeMenus, openTab, tab } from "./tab";

// First use: the one question, what it sets up, and what happens since the last visit.
// Firebase is blank (demo workspace), so a new browser has no saved answer.

// by role only: the dialog is named after its title, which changes with the step
const askedDialog = (page: Page) => page.getByRole("dialog");
const more = (page: Page) =>
  page
    .getByRole("navigation", { name: "Modos" })
    .getByRole("button", { name: "Más" });

async function answer(page: Page, goal: RegExp, region: string) {
  const dlg = askedDialog(page);
  await dlg.getByRole("button", { name: goal }).click();
  await dlg.getByRole("button", { name: "Siguiente" }).click();
  await dlg.getByRole("button", { name: region }).click();
  return dlg;
}

for (const size of [
  { name: "escritorio", width: 1440, height: 800 },
  { name: "teléfono", width: 390, height: 844 },
]) {
  firstRunTest.describe(`primer uso en ${size.name}`, () => {
    firstRunTest.use({ viewport: { width: size.width, height: size.height } });

    firstRunTest(
      "pregunta qué vigilar, deja el panel armado y no vuelve a preguntar",
      async ({ page }) => {
        await page.goto("/admin");
        const dlg = askedDialog(page);
        await expect(dlg).toBeVisible();
        await expect(
          dlg.getByRole("button", { name: "Siguiente" }),
        ).toBeDisabled();

        await answer(page, /Mi lote o mi zona/, "Sierras de Córdoba");
        await expect(dlg.getByText("Empezás en: Zonas")).toBeVisible();
        await expect(
          dlg.getByText("2 avisos activados dentro de la app"),
        ).toBeVisible();
        await dlg.getByRole("button", { name: "Armar mi panel" }).click();
        await expect(dlg).toBeHidden();

        // starts where the goal says, with only the essentials in the bar
        await expect(tab(page, "Zonas")).toHaveAttribute(
          "aria-current",
          "page",
        );
        await expect(tab(page, "Recursos")).toBeHidden();
        await more(page).click();
        await expect(
          page.getByRole("menuitem", { name: "Recursos" }),
        ).toBeVisible();
        await closeMenus(page);

        // the setup list is the goal's own (two steps), not the generic four
        await openTab(page, /^(Vista general|General)/);
        await expect(page.getByText("Primeros pasos · 0/2")).toBeVisible();

        await page.reload();
        await expect(
          page.getByRole("navigation", { name: "Modos" }),
        ).toBeVisible();
        await expect(askedDialog(page)).toBeHidden();
        await expect(tab(page, "Recursos")).toBeHidden();
      },
    );

    firstRunTest(
      "se puede saltear sin cambiar nada y se puede volver a elegir desde Configuración",
      async ({ page }) => {
        await page.goto("/admin");
        await askedDialog(page)
          .getByRole("button", { name: "Saltear por ahora" })
          .click();
        await expect(askedDialog(page)).toBeHidden();

        await openTab(page, /^(Configuración|Config)/);
        await expect(
          page.getByRole("checkbox", { name: /Modo simple/ }),
        ).not.toBeChecked();
        await page.getByRole("button", { name: "Elegir de nuevo" }).click();
        await expect(askedDialog(page)).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(askedDialog(page)).toBeHidden();
      },
    );

    firstRunTest(
      "el modo simple se activa y se apaga en Configuración",
      async ({ page }) => {
        await page.goto("/admin");
        await askedDialog(page)
          .getByRole("button", { name: "Saltear por ahora" })
          .click();
        await openTab(page, /^(Configuración|Config)/);
        await page
          .getByRole("checkbox", { name: /Modo simple/ })
          .check({ force: true });
        await expect(tab(page, "Pronóstico")).toBeHidden();
        await page
          .getByRole("checkbox", { name: /Modo simple/ })
          .uncheck({ force: true });
        await expect(
          page.getByRole("checkbox", { name: /Modo simple/ }),
        ).not.toBeChecked();
      },
    );

    firstRunTest(
      "la pantalla de primer uso pasa axe en claro y oscuro",
      async ({ page }) => {
        for (const scheme of ["light", "dark"] as const) {
          await page.emulateMedia({ reducedMotion: "reduce" });
          await page.addInitScript((d) => {
            try {
              localStorage.setItem("sentinel-admin-theme", d);
            } catch {}
          }, scheme);
          await page.goto("/admin");
          await expect(askedDialog(page)).toBeVisible();
          // axe cannot judge text under the translucent overlay, so check the colour itself: light text on dark, dark on light
          const [r, g, b] = await askedDialog(page)
            .getByRole("heading")
            .evaluate((el) =>
              getComputedStyle(el).color.match(/\d+/g)!.slice(0, 3).map(Number),
            );
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          expect(
            scheme === "dark" ? brightness > 160 : brightness < 90,
            `${scheme} heading colour ${r},${g},${b}`,
          ).toBe(true);
          for (const step of ["goal", "region"]) {
            if (step === "region") {
              await askedDialog(page)
                .getByRole("button", { name: /Mi lote o mi zona/ })
                .click();
              await askedDialog(page)
                .getByRole("button", { name: "Siguiente" })
                .click();
            }
            await page.waitForTimeout(400);
            const { violations } = await new AxeBuilder({ page })
              .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
              .include('[role="dialog"]')
              .analyze();
            const bad = violations.filter(
              (v) => v.impact === "serious" || v.impact === "critical",
            );
            expect(bad.map((v) => `${scheme} ${step} ${v.id}`)).toEqual([]);
          }
        }
      },
    );
  });
}

// "What happened since last time": early alerts and new fires come from mocked feeds, the last visit from storage.
test.describe("novedades desde la última visita", () => {
  const MIN = 60_000;
  async function openWithNews(page: Page, since: number | null) {
    const now = Date.now();
    const at = new Date(now - 30 * MIN);
    const hhmm = Number(
      `${String(at.getUTCHours()).padStart(2, "0")}${String(at.getUTCMinutes()).padStart(2, "0")}`,
    );
    await page.route("**/api/admin/early", (r) =>
      r.fulfill({
        json: {
          updated: new Date(now).toISOString(),
          fetchedAt: now,
          early: [
            {
              lat: -24.7512,
              lng: -60.7155,
              frp: 131.5,
              scans: 12,
              firstAt: now - 90 * MIN,
              lastAt: now - 12 * MIN,
              sources: ["FIRMS", "INPE"],
            },
          ],
          sources: [
            {
              id: "goes-firms",
              label: "GOES-19 · NASA FIRMS",
              ok: true,
              count: 40,
              newestAt: now - 12 * MIN,
            },
          ],
        },
      }),
    );
    await page.route("**/api/admin/fires", (r) =>
      r.fulfill({
        json: {
          updated: new Date(now).toISOString(),
          days: [at.toISOString().slice(0, 10)],
          points: [[-41.1, -71.3, 12, 1, 0, hhmm, 0]],
          clusters: [],
          fetchedAt: now,
          newestDetectionAt: at.getTime(),
          sources: [
            {
              id: "n20",
              label: "NOAA-20 · VIIRS",
              ok: true,
              count: 1,
              newestAt: at.getTime(),
            },
          ],
        },
      }),
    );
    if (since !== null)
      await page.addInitScript((v) => {
        try {
          localStorage.setItem("sentinel-admin-last-visit", String(v));
        } catch {}
      }, since);
    await page.goto("/admin");
    return page.getByRole("region", {
      name: "Novedades desde tu última visita",
    });
  }

  const toggle = (brief: Locator) => brief.getByRole("button", { name: /(Desde tu última visita|Lo que pasa ahora)/ });

  test("resume lo nuevo con una acción por ítem", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 800 });
    const brief = await openWithNews(page, Date.now() - 3 * 60 * MIN);
    await expect(toggle(brief)).toContainText("hace 3 h", { timeout: 20_000 });
    await expect(toggle(brief)).toHaveAttribute("aria-expanded", "false");
    await toggle(brief).click();
    await expect(brief.getByText("1 alerta temprana sin confirmar")).toBeVisible();
    await expect(brief.getByText("1 foco nuevo en Argentina")).toBeVisible();
    await brief.getByRole("button", { name: "Ver alertas" }).click();
    await expect(page.getByRole("tab", { name: "Alertas" })).toHaveAttribute("aria-selected", "true");
    // taking the action closes the list
    await expect(brief.getByText("1 foco nuevo en Argentina")).toBeHidden();
  });

  test("la primera vez no inventa focos nuevos", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 800 });
    const brief = await openWithNews(page, null);
    await expect(toggle(brief)).toContainText("Lo que pasa ahora", { timeout: 20_000 });
    await toggle(brief).click();
    await expect(brief.getByText("1 alerta temprana sin confirmar")).toBeVisible();
    await expect(brief.getByText(/foco nuevo/)).toHaveCount(0);
  });

  test("la fila ocupa siempre lo mismo: el mapa no se corre cuando llegan las novedades", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 800 });
    const canvas = page.locator("canvas.maplibregl-canvas");
    const brief = await openWithNews(page, Date.now() - 3 * 60 * MIN);
    await expect(canvas).toBeVisible({ timeout: 30_000 });
    const top = (await canvas.boundingBox())!.y;
    await expect(toggle(brief)).toBeVisible({ timeout: 20_000 });
    await toggle(brief).click(); // opening the list must not move the map either
    await expect(brief.getByText("1 alerta temprana sin confirmar")).toBeVisible();
    expect((await canvas.boundingBox())!.y).toBe(top);
  });

  test("en teléfono la fila es táctil y la lista se abre a pedido", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const brief = await openWithNews(page, Date.now() - 3 * 60 * MIN);
    await expect(toggle(brief)).toBeVisible({ timeout: 20_000 });
    expect((await toggle(brief).boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(brief.getByText("1 alerta temprana sin confirmar")).toBeHidden();
    await toggle(brief).click();
    await expect(brief.getByText("1 alerta temprana sin confirmar")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(brief.getByText("1 alerta temprana sin confirmar")).toBeHidden();
  });
});
