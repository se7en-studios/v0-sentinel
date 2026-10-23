import { expect, test, type Page } from "@playwright/test";

// "Ver incidente" in a fire popup must land on THAT incident, not on the first one of the list.
// Fires and terrain are simulated, so nothing here depends on live data.

const today = () => new Date().toISOString().slice(0, 10);
const tab = (page: Page, name: string) =>
  page.getByRole("navigation", { name: "Modos" }).getByRole("button", { name });

// default region (Patagonia Andina) is centred on [-71.5, -41.6]
const CENTER = { lat: -41.6, lng: -71.5 };

/** `n` pixels a few metres apart: one incident each, tight enough to share a screen pixel at the centre. */
const bunch = (lat: number, lng: number, n: number, frp: number) =>
  Array.from({ length: n }, (_, i) => [lat + i * 0.0003, lng, frp, 2, 0, 1200 + i, 0, 0]);

test("el popup de un foco abre el incidente que lo contiene", async ({ page }) => {
  // the first map render in a cold dev server, with other specs compiling at the same time, can take close to a minute
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    try {
      localStorage.clear();
    } catch {
      /* private mode */
    }
  });
  // the big incident comes first in the list; the small one sits under the map centre
  const points = [...bunch(-42.3, -71.5, 8, 60), ...bunch(CENTER.lat, CENTER.lng, 5, 14)];
  await page.route("**/api/admin/fires", (r) =>
    r.fulfill({
      json: {
        updated: new Date().toISOString(),
        days: [today()],
        points,
        clusters: [],
        fetchedAt: Date.now(),
        sources: [],
      },
    }),
  );
  await page.route("**/api/admin/terrain**", (r) => r.fulfill({ status: 502, json: { error: "x" } }));
  await page.goto("/admin");
  const canvas = page.locator("canvas.maplibregl-canvas");
  await expect(canvas).toBeVisible({ timeout: 30_000 });
  const box = (await canvas.boundingBox())!;
  const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

  const verIncidente = page.getByRole("button", { name: "Ver incidente" });
  // the first click may land on a cluster (it zooms in); keep clicking the centre until the popup shows
  await expect(async () => {
    await page.mouse.click(centre.x, centre.y);
    await expect(verIncidente).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 30_000 });
  await verIncidente.click();

  await expect(tab(page, "Incidentes")).toHaveAttribute("aria-current", /page|true/);
  const selected = page.getByRole("list", { name: "Incidentes" }).locator('button[aria-pressed="true"]');
  await expect(selected).toHaveCount(1);
  await expect(selected).toContainText("5 focos");
});
