import { expect, test, type Page } from "@playwright/test";

// Smoke tests of the admin shell in demo mode. They must not depend on live fire data
// or on third-party APIs answering, so they only assert on the UI the app owns.

const tab = (page: Page, name: string) =>
  page.getByRole("navigation", { name: "Modos" }).getByRole("button", { name });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
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
    await tab(page, button).click();
    await expect(
      page.getByRole("heading", { level: 1, name: heading }),
    ).toBeVisible();
  }
});

test("los datos de ejemplo cargan zonas y drones", async ({ page }) => {
  await page
    .getByRole("button", { name: "O probá con datos de ejemplo" })
    .click();
  await tab(page, "Zonas").click();
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

test("si falla el clima, la tarjeta lo dice y ofrece reintentar", async ({ page }) => {
  await page.route("**/api.open-meteo.com/**", (r) => r.abort());
  await page.goto("/admin");
  await expect(page.getByText("No pudimos consultar el clima")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Reintentar" }).first()).toBeVisible();
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

  test("la barra de pestañas se desplaza sin barra visible", async ({
    page,
  }) => {
    const nav = page.getByRole("navigation", { name: "Modos" });
    await expect(nav).toBeVisible();
    const noScrollbar = await nav.evaluate(
      (el) => getComputedStyle(el).scrollbarWidth,
    );
    expect(noScrollbar).toBe("none");
  });
});
