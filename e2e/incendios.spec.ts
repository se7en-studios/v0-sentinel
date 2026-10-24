import { expect, test } from "@playwright/test";

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
