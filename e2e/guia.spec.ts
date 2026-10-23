import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

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

async function openFromPalette(page: Page) {
  await page.keyboard.press("Control+k");
  await page.getByRole("dialog").getByRole("combobox").fill("Guía rápida");
  await page.getByRole("option", { name: /Guía rápida/ }).click();
  const dlg = page.getByRole("dialog", { name: "Guía rápida" });
  await expect(dlg).toBeVisible();
  return dlg;
}

test("guía rápida: se abre desde la paleta, muestra las cifras del backtest y cierra con Escape", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openAdmin(page, false);
  const dlg = await openFromPalette(page);
  await expect(dlg.getByRole("heading", { name: "Guía rápida" })).toBeVisible();
  await dlg.getByText("Alertas tempranas y confianza").click();
  await expect(dlg.getByText(/Menos de 5 escaneos: 57 %/)).toBeVisible();
  await expect(dlg.getByText(/De 5 a 11 escaneos: 72 %/)).toBeVisible();
  await expect(dlg.getByText(/12 o más escaneos: 92 %/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dlg).toBeHidden();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("sentinel-admin-guide-seen"),
    ),
  ).toBe("1");
});

test("guía rápida: se abre desde la ayuda de atajos", async ({ page }) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openAdmin(page, false);
  await page.keyboard.press("Shift+?");
  await page.getByRole("button", { name: "Abrir la guía rápida" }).click();
  await expect(page.getByRole("dialog", { name: "Guía rápida" })).toBeVisible();
});

for (const dark of [false, true]) {
  test(`a11y diálogo guía rápida ${dark ? "oscuro" : "claro"}`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openAdmin(page, dark);
    const dlg = await openFromPalette(page);
    // open every section so axe sees all the text
    await dlg.evaluate((el) => el.querySelectorAll("details").forEach((d) => (d.open = true)));
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      expect(
        await page.evaluate(
          () => !!document.activeElement?.closest('[role="dialog"]'),
        ),
      ).toBe(true);
    }
    const { violations } = await new AxeBuilder({ page })
      .withTags(TAGS)
      .include('[role="dialog"]')
      .analyze();
    expect(
      violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .map((v) => v.id),
    ).toEqual([]);
  });
}
