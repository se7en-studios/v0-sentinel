import { expect, test } from "./fixtures";
import { openTab } from "./tab";

// Smoke tests of the admin shell in demo mode. They must not depend on live fire data
// or on third-party APIs answering, so they only assert on the UI the app owns.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      localStorage.setItem("sentinel-admin-workspace-v1", '{"settings":{"onboarded":true}}'); // first-run question already answered
    } catch {
      /* private mode */
    }
  });
  await page.goto("/admin");
  await expect(page.getByRole("navigation", { name: "Modos" })).toBeVisible();
});

test("carga el panel con la franja de estado y el mapa", async ({ page }) => {
  await expect(
    page.getByRole("list", { name: "Estado general" }),
  ).toBeVisible();
  await expect(page.getByText("Riesgo hoy")).toBeVisible();
  await expect(page.locator("canvas.maplibregl-canvas")).toBeVisible();
});

test("recorre las vistas de ancho completo sin romperse", async ({ page }) => {
  const views: [string, string][] = [
    ["Pronóstico", "Pronóstico de riesgo"],
    ["Incidentes", "Incidentes"],
    ["Métricas", "Métricas"],
    ["Configuración", "Configuración"],
  ];
  for (const [button, heading] of views) {
    await openTab(page, button);
    await expect(
      page.getByRole("heading", { level: 1, name: heading }),
    ).toBeVisible();
  }
});

test("los datos de ejemplo cargan zonas y drones", async ({ page }) => {
  await page
    .getByRole("button", { name: "O probá con datos de ejemplo" })
    .click();
  await openTab(page, "Zonas");
  await expect(page.getByText("Sector Norte").first()).toBeVisible();
});

test("la bitácora guarda una entrada con autor y hora", async ({ page }) => {
  await page.getByRole("tab", { name: "Notas" }).click();
  const box = page.getByRole("textbox", {
    name: "Nueva entrada de la bitácora",
  });
  await box.fill("Foco verificado por llamada con el puestero");
  await page.getByRole("button", { name: "Agregar", exact: true }).click();
  const log = page.getByRole("list", { name: "Entradas de la bitácora" });
  await expect(
    log.getByText("Foco verificado por llamada con el puestero"),
  ).toBeVisible();
  await expect(box).toHaveValue("");
});

test("la paleta de comandos abre con Ctrl+K y filtra", async ({ page }) => {
  await page.keyboard.press("Control+K");
  const input = page.getByPlaceholder(/Ir a/);
  await expect(input).toBeVisible();
  await input.fill("Pronóstico");
  await expect(
    page.getByRole("option", { name: /Pronóstico/ }).first(),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(input).toBeHidden();
});

test("una regla con valores inválidos se rechaza y una válida se crea", async ({
  page,
}) => {
  await page.getByRole("tab", { name: "Alertas" }).click();
  await page
    .getByLabel("Nueva regla")
    .selectOption({ label: "Actividad en Argentina" });
  const focos = page.getByLabel("Focos en 24 h ≥");
  await focos.fill("0");
  await page.getByRole("button", { name: "Agregar regla" }).click();
  await expect(page.getByText("Revisá los valores de la regla")).toBeVisible();
  await focos.fill("50");
  await page.getByRole("button", { name: "Agregar regla" }).click();
  await expect(page.getByText(/50\+ focos en 24 h/)).toBeVisible();
});

test("si falla el clima, la tarjeta lo dice y ofrece reintentar", async ({
  page,
}) => {
  await page.route("**/api.open-meteo.com/**", (r) => r.abort());
  await page.goto("/admin");
  await expect(page.getByText("No pudimos consultar el clima")).toBeVisible({
    timeout: 15_000,
  });
  await expect(
    page.getByRole("button", { name: "Reintentar" }).first(),
  ).toBeVisible();
});

test("GOES-19: la alerta temprana aparece en Alertas y las fuentes en Métricas", async ({
  page,
}) => {
  const now = Date.now();
  const min = 60_000;
  const goes = (id: string, label: string, count: number) => ({
    id,
    label,
    ok: true,
    count,
    newestAt: now - 12 * min,
  });
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
            firstAt: now - 90 * min,
            lastAt: now - 12 * min,
            sources: ["FIRMS", "INPE"],
          },
        ],
        sources: [
          goes("goes-firms", "GOES-19 · NASA FIRMS", 40),
          goes("goes-inpe", "GOES-19 · INPE", 9),
        ],
      },
    }),
  );
  await page.route("**/api/admin/fires", (r) =>
    r.fulfill({
      json: {
        updated: new Date(now).toISOString(),
        days: [new Date(now).toISOString().slice(0, 10)],
        points: [],
        clusters: [],
        fetchedAt: now,
        sources: [
          {
            id: "n20",
            label: "NOAA-20 · VIIRS",
            ok: true,
            count: 0,
            newestAt: now - 6 * 60 * min,
          },
        ],
      },
    }),
  );
  await page.goto("/admin");
  await expect(page.getByText("1 sin confirmar")).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole("tab", { name: "Alertas" }).click();
  const list = page.getByRole("list", { name: "Alertas tempranas abiertas" });
  await expect(list.getByText(/12 escaneos/)).toBeVisible();
  await expect(list.getByText("NASA + INPE")).toBeVisible();
  await openTab(page, "Métricas");
  const table = page.getByRole("table", {
    name: "Estado de cada fuente satelital",
  });
  await expect(
    table.getByRole("rowheader", { name: "GOES-19 · INPE" }),
  ).toBeVisible();
  await expect(
    table.getByRole("rowheader", { name: "NOAA-20 · VIIRS" }),
  ).toBeVisible();
});

test("GOES y MODIS se pueden apagar en Configuración", async ({ page }) => {
  await page.goto("/admin");
  await openTab(page, "Configuración");
  const toggle = page.getByRole("checkbox", { name: /Alertas tempranas/ });
  await expect(toggle).toBeChecked();
  await toggle.uncheck({ force: true });
  await expect(toggle).not.toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: /Incluir MODIS/ }),
  ).toBeChecked();
});

test("cambiar el idioma traduce las pestañas y la franja de estado", async ({
  page,
}) => {
  await page.goto("/admin");
  await openTab(page, "Configuración");
  await page.getByLabel("Idioma").selectOption("en");
  // the landmark label is translated too (Modos / Modes)
  const nav = page.getByRole("navigation", { name: /^(Modos|Modes)$/ });
  await expect(nav.getByRole("button", { name: "Settings" })).toBeVisible();
  await expect(nav.getByRole("button", { name: "Zones" })).toBeVisible();
  await expect(page.getByText("Risk today")).toBeVisible();
  await page.getByLabel("Language").selectOption("pt");
  await expect(nav.getByRole("button", { name: "Zonas" })).toBeVisible();
  await expect(page.getByText("Risco hoje")).toBeVisible();
});

test.describe("en un teléfono", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("el menú Más da acceso a lo que en escritorio está en la barra", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Más opciones" }).click();
    await expect(
      page.getByRole("menuitem", { name: /Buscar y comandos/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: /Reporte PDF/ }),
    ).toBeVisible();
  });

  test("las pestañas que no entran van al menú Más", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Modos" });
    await expect(nav).toBeVisible();
    // nothing clips: the strip never scrolls sideways, the overflow goes to the menu
    expect(await nav.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    const more = nav.getByRole("button", { name: "Más" });
    await expect(more).toBeVisible();
    await more.click();
    await page.getByRole("menuitem", { name: "Configuración" }).click();
    await expect(page.getByRole("heading", { name: "Configuración" })).toBeVisible();
  });
});
