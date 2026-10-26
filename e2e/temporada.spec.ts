import { expect, test, type Page } from "@playwright/test";
import { openTab } from "./tab";

// "Temporada" card in Metrics. /api/admin/history is simulated with page.route.

const flat = (v: number) => Array(10).fill(v);
const end = new Date().toISOString().slice(0, 10);
const year = Number(end.slice(0, 4));

const body = (counts: (number[] | null)[]) => ({
  updated: new Date().toISOString(),
  end,
  window: 10,
  satellite: "VIIRS NOAA-20",
  years: counts.map((c, i) => ({
    year: year - i,
    source: i ? "SP" : "NRT",
    counts: c,
  })),
});

async function openMetrics(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
    } catch {
      /* private mode */
    }
  });
  await page.goto("/admin");
  await openTab(page, "Métricas");
  await expect(page.getByRole("heading", { name: "Temporada" })).toBeVisible({
    timeout: 30_000,
  });
}

test("muestra el veredicto, el gráfico con su tabla y con cuántos años se comparó", async ({
  page,
}) => {
  await page.route("**/api/admin/history", (r) =>
    r.fulfill({ json: body([flat(23), flat(10), flat(10), null]) }),
  );
  await openMetrics(page);
  await expect(page.getByText("Por encima de lo normal")).toBeVisible();
  await expect(
    page.getByText(/Hoy hay 2,3 veces los focos de un día típico/),
  ).toBeVisible();
  await expect(
    page.getByText(/Comparado con 2 de 3 años anteriores/),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: /Focos por día en los últimos 10 días/ }),
  ).toBeVisible();
});

test("sin años anteriores con datos no inventa un veredicto", async ({
  page,
}) => {
  await page.route("**/api/admin/history", (r) =>
    r.fulfill({ json: body([flat(23), null, null, null]) }),
  );
  await openMetrics(page);
  await expect(page.getByText("Sin veredicto")).toBeVisible();
  await expect(
    page.getByText(/no devolvió datos de años anteriores/),
  ).toBeVisible();
  await expect(page.getByText(/veces los focos/)).toHaveCount(0);
});

test("si el servidor falla lo dice y permite reintentar", async ({ page }) => {
  let failing = true;
  await page.route("**/api/admin/history", (r) =>
    failing
      ? r.fulfill({ status: 502, json: { error: "x" } })
      : r.fulfill({ json: body([flat(10), flat(10), flat(10), flat(10)]) }),
  );
  await openMetrics(page);
  await expect(
    page.getByText("No se pudo traer la comparación con otras temporadas."),
  ).toBeVisible();
  failing = false;
  await page.getByRole("button", { name: "Reintentar", exact: true }).click();
  await expect(page.getByText("Normal para la época")).toBeVisible();
});
