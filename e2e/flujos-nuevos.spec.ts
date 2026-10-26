import { expect, test } from "@playwright/test";
import { openTab } from "./tab";

// Flows added with GOES-19, MODIS, terrain and the language switch. Every external answer is simulated
// with page.route, so none of these depend on live fire data.

const MIN = 60_000;
const today = () => new Date().toISOString().slice(0, 10);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
    } catch {
      /* private mode */
    }
  });
});

/** Six VIIRS pixels and one MODIS pixel around the same spot: enough to open an incident. */
function firesPayload(now: number) {
  const viirs = (i: number) => [-40.1 + i * 0.002, -71.1 + i * 0.002, 14, 2, 0, 1200 + i, 0, 0];
  const modis = [-40.101, -71.101, 40, 2, 0, 1230, 0, 2];
  return {
    updated: new Date(now).toISOString(),
    days: [today()],
    points: [0, 1, 2, 3, 4, 5].map(viirs).concat([modis]),
    clusters: [],
    fetchedAt: now,
    sources: [],
  };
}

test("el terreno bajo un incidente se muestra desde /api/admin/terrain", async ({ page }) => {
  await page.route("**/api/admin/fires", (r) => r.fulfill({ json: firesPayload(Date.now()) }));
  const calls: string[] = [];
  await page.route("**/api/admin/terrain**", (r) => {
    // the batch endpoint (confidence scoring) is a different call: it must fail soft, not count here
    if (r.request().url().includes("/terrain/batch"))
      return r.fulfill({ status: 503, json: { error: "simulado" } });
    calls.push(r.request().url());
    return r.fulfill({
      json: {
        landCover: 10,
        landCoverLabel: "Bosque",
        burnable: true,
        elevation: 1234,
        slopeDeg: 17,
        aspectDeg: 90,
        aspectLabel: "E",
      },
    });
  });
  await page.goto("/admin");
  await openTab(page, "Incidentes");
  await expect(page.getByText("Terreno y combustible")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/Bosque/).first()).toBeVisible();
  expect(calls.length).toBeGreaterThan(0);
  expect(calls[0]).toMatch(/lat=-40\.\d+&lng=-71\.\d+/);
});

test("si el terreno falla, el incidente lo dice sin romperse", async ({ page }) => {
  await page.route("**/api/admin/fires", (r) => r.fulfill({ json: firesPayload(Date.now()) }));
  await page.route("**/api/admin/terrain**", (r) => r.fulfill({ status: 502, json: { error: "x" } }));
  await page.goto("/admin");
  await openTab(page, "Incidentes");
  await expect(page.getByText("No se pudo consultar el terreno ahora.")).toBeVisible({
    timeout: 20_000,
  });
});

test("la opción de MODIS se apaga y se mantiene al cambiar de vista", async ({ page }) => {
  await page.route("**/api/admin/fires", (r) => r.fulfill({ json: firesPayload(Date.now()) }));
  await page.goto("/admin");
  await openTab(page, "Configuración");
  const modis = page.getByRole("checkbox", { name: /Incluir MODIS/ });
  await modis.uncheck({ force: true });
  await expect(modis).not.toBeChecked();
  // the setting survives leaving and coming back to the view
  await openTab(page, "Pronóstico");
  await openTab(page, "Configuración");
  await expect(page.getByRole("checkbox", { name: /Incluir MODIS/ })).not.toBeChecked();
});

test("sin alertas tempranas el panel no avisa nada y el servidor caído no lo rompe", async ({
  page,
}) => {
  await page.route("**/api/admin/early", (r) => r.fulfill({ status: 503, json: { error: "caído" } }));
  await page.goto("/admin");
  await expect(page.getByRole("navigation", { name: "Modos" })).toBeVisible();
  await expect(page.getByText("sin confirmar")).toHaveCount(0);
  await openTab(page, "Métricas");
  await expect(page.getByRole("heading", { level: 1, name: "Métricas" })).toBeVisible();
});

test("una alerta temprana vieja (más de 90 min) no suma al contador", async ({ page }) => {
  const now = Date.now();
  await page.route("**/api/admin/early", (r) =>
    r.fulfill({
      json: {
        updated: new Date(now).toISOString(),
        fetchedAt: now,
        early: [
          {
            lat: -24.7512,
            lng: -60.7155,
            frp: 50,
            scans: 8,
            firstAt: now - 300 * MIN,
            lastAt: now - 200 * MIN,
            sources: ["FIRMS"],
          },
        ],
        sources: [],
      },
    }),
  );
  await page.goto("/admin");
  await expect(page.getByRole("navigation", { name: "Modos" })).toBeVisible();
  await expect(page.getByText("1 sin confirmar")).toHaveCount(0);
});
