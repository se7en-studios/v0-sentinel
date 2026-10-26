import { expect, test, type Page } from "@playwright/test";
import { openTab } from "./tab";

// Resilience of the admin shell: API down then back, expired session, slow API, no network, and a view
// that fails to render. /api/admin/fires and /early are simulated with page.route (no real data needed).

const banner = (page: Page) => page.getByTestId("connection-banner");

const today = new Date().toISOString().slice(0, 10);
const firesOk = {
  updated: new Date().toISOString(),
  days: [today],
  points: [[-40.1, -71.3, 12, 2, 0, 1830, 0]],
  clusters: [],
  // one feed with a count: Métricas formats it with toLocaleString, which the render-failure test sabotages
  sources: [{ id: "firms-viirs", label: "VIIRS", ok: true, count: 1234 }],
};
const earlyOk = {
  updated: new Date().toISOString(),
  fetchedAt: Date.now(),
  early: [],
  sources: [],
};
/** the first real retries wait 1-2 s, 2-4 s, 4-8 s: a call is only reported as failed after that */
const RETRIES_DONE = 45_000;

type Mode = "ok" | "500" | "401" | "slow";
/** Answers both polled endpoints according to a mode that the test flips; counts the hits. */
async function stubApi(page: Page, initial: Mode) {
  const state = { mode: initial, fires: 0, early: 0, slowMs: 6000 };
  const answer =
    (kind: "fires" | "early") =>
    async (route: import("@playwright/test").Route) => {
      state[kind] += 1;
      const body = kind === "fires" ? firesOk : earlyOk;
      if (state.mode === "500")
        return route.fulfill({
          status: 500,
          json: { error: "Servidor caído" },
        });
      if (state.mode === "401")
        return route.fulfill({ status: 401, json: { error: "No autorizado" } });
      if (state.mode === "slow")
        await new Promise((r) => setTimeout(r, state.slowMs));
      return route.fulfill({ json: body }).catch(() => {});
    };
  await page.route("**/api/admin/fires", answer("fires"));
  await page.route("**/api/admin/early", answer("early"));
  return state;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      if (!sessionStorage.getItem("seeded")) {
        localStorage.clear();
        sessionStorage.setItem("seeded", "1");
      }
    } catch {
      /* private mode */
    }
  });
});

test("API caída: reintenta solo, avisa y se recupera sin recargar", async ({
  page,
}) => {
  const api = await stubApi(page, "500");
  await page.goto("/admin");
  await expect(banner(page)).toBeVisible({ timeout: RETRIES_DONE });
  await expect(banner(page)).toHaveAttribute("data-health", "degraded");
  await expect(banner(page)).toContainText("El servidor no responde");
  expect(api.fires).toBeGreaterThan(1); // retried with backoff instead of waiting for the next cycle
  api.mode = "ok";
  await banner(page).getByRole("button", { name: "Reintentar ahora" }).click();
  await expect(banner(page)).toBeHidden();
  await expect(
    page.getByRole("list", { name: "Estado general" }),
  ).toBeVisible();
});

test("sesión vencida (401): no reintenta, avisa y conserva lo local", async ({
  page,
}) => {
  const api = await stubApi(page, "401");
  await page.goto("/admin");
  await page
    .getByRole("button", { name: "O probá con datos de ejemplo" })
    .click();
  await expect(banner(page)).toBeVisible();
  await expect(banner(page)).toHaveAttribute("data-health", "auth");
  await expect(
    banner(page).getByRole("button", { name: "Iniciar sesión" }),
  ).toBeVisible();
  // dev mode mounts effects twice, so the initial burst may be 2 calls: what must not happen is a retry after it
  const burst = { fires: api.fires, early: api.early };
  expect(burst.fires).toBeGreaterThan(0);
  await page.waitForTimeout(6000); // a retrying client would have hit the API again by now
  expect(api.fires).toBe(burst.fires);
  expect(api.early).toBe(burst.early);
  await openTab(page, "Zonas");
  await expect(page.getByText("Sector Norte").first()).toBeVisible(); // local edits survive
});

test("respuesta lenta: lo cargado sigue usable y no aparece aviso falso", async ({
  page,
}) => {
  const api = await stubApi(page, "slow");
  await page.goto("/admin");
  await expect(
    page.getByRole("list", { name: "Estado general" }),
  ).toBeVisible();
  await openTab(page, "Métricas");
  await expect(
    page.getByRole("heading", { level: 1, name: "Métricas" }),
  ).toBeVisible();
  await expect(banner(page)).toBeHidden();
  expect(api.fires).toBeGreaterThan(0);
});

test("sin red: aviso con el último dato, la pantalla sigue y se va al volver", async ({
  page,
  context,
}) => {
  await stubApi(page, "ok");
  await page.goto("/admin");
  await expect(
    page.getByRole("list", { name: "Estado general" }),
  ).toBeVisible();
  await expect(banner(page)).toBeHidden();
  await openTab(page, "Pronóstico"); // let the first good data land before cutting the network
  await expect(
    page.getByRole("heading", { level: 1, name: "Pronóstico de riesgo" }),
  ).toBeVisible();
  await context.setOffline(true);
  await expect(banner(page)).toHaveAttribute("data-health", "offline");
  await expect(banner(page)).toContainText(
    "tus cambios se guardan en este dispositivo",
  );
  await expect(banner(page)).toContainText("Último dato bueno");
  await expect(
    page.getByRole("heading", { level: 1, name: "Pronóstico de riesgo" }),
  ).toBeVisible();
  await context.setOffline(false);
  await expect(banner(page)).toBeHidden();
});

test("respuesta malformada: error de carga acotado, el panel sigue usable", async ({
  page,
}) => {
  await page.route(
    "**/api/admin/fires",
    (r) =>
      r.fulfill({
        json: { ...firesOk, sources: [{ id: "x", label: "X", ok: true }] },
      }), // no `count`: used to crash Métricas
  );
  await page.route("**/api/admin/early", (r) => r.fulfill({ json: earlyOk }));
  await page.goto("/admin");
  await openTab(page, "Métricas");
  await expect(page.getByTestId("view-error")).toBeHidden();
  await expect(page.getByText("Algo falló en el panel")).toBeHidden();
  // the bad body is reported as a load error instead of reaching the charts
  await expect(page.getByText("Respuesta de focos inválida").first()).toBeVisible();
  await openTab(page, "Configuración");
  await expect(page.getByRole("heading", { level: 1, name: "Configuración" })).toBeVisible();
});

test("una vista que falla al renderizar cae sola y se puede reintentar", async ({
  page,
}) => {
  await stubApi(page, "ok");
  await page.goto("/admin");
  await expect(
    page.getByRole("list", { name: "Estado general" }),
  ).toBeVisible();
  // simulated render bug: formatting the feed count throws while the flag is on
  await page.evaluate(() => {
    const w = window as unknown as { __boom?: boolean };
    const orig = Number.prototype.toLocaleString;
    Number.prototype.toLocaleString = function (...a: Parameters<typeof orig>) {
      if (w.__boom && Number(this) === 1234) throw new TypeError("boom (test)"); // 1234 = the feed count only Métricas formats
      return orig.apply(this, a);
    };
    w.__boom = true;
  });
  await openTab(page, "Métricas");
  await expect(page.getByTestId("view-error")).toContainText(
    "No se pudo mostrar Métricas",
  );
  await page.evaluate(
    () => ((window as unknown as { __boom?: boolean }).__boom = false),
  );
  // the rest of the panel keeps working
  await openTab(page, "Incidentes");
  await expect(
    page.getByRole("heading", { level: 1, name: "Incidentes" }),
  ).toBeVisible();
  await expect(page.getByText("Algo falló en el panel")).toBeHidden();
  // and the failed view recovers (leaving the tab already cleared it; failing again shows the retry button)
  await page.evaluate(
    () => ((window as unknown as { __boom?: boolean }).__boom = true),
  );
  await openTab(page, "Métricas");
  await expect(page.getByTestId("view-error")).toBeVisible();
  await page.evaluate(
    () => ((window as unknown as { __boom?: boolean }).__boom = false),
  );
  await page.getByRole("button", { name: "Reintentar" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Métricas" }),
  ).toBeVisible();
});
