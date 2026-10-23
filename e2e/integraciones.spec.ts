import { expect, test, type Page } from "@playwright/test";

// Integrations card in Settings. /api/admin/health and /api/admin/notify are simulated with page.route,
// so nothing real is probed or sent.

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
});

const healthJson = {
  updated: new Date().toISOString(),
  ok: false,
  sources: [
    {
      id: "firms-viirs",
      label: "NASA FIRMS · VIIRS (NOAA-20/21)",
      ok: true,
      latencyMs: 420,
      ageMin: 35,
    },
    {
      id: "inpe",
      label: "INPE · archivos de 10 min",
      ok: true,
      latencyMs: 4200,
      ageMin: 10,
    },
    {
      id: "aws-terrain",
      label: "AWS · terreno (Copernicus DEM)",
      ok: false,
      latencyMs: 6000,
      error: "Sin respuesta a tiempo",
    },
  ],
};

async function openCard(page: Page) {
  await page.goto("/admin");
  await tab(page, "Configuración").click();
  await expect(
    page.getByRole("heading", { name: "Estado de las fuentes" }),
  ).toBeVisible({ timeout: 20_000 });
}

test("el estado de las fuentes muestra activa, lenta y sin respuesta", async ({
  page,
}) => {
  await page.route("**/api/admin/health", (r) =>
    r.fulfill({ json: healthJson }),
  );
  await openCard(page);
  await page.getByRole("button", { name: "Revisar ahora" }).click();
  await expect(page.getByText("1 de 3 fuentes con problemas")).toBeVisible();
  await expect(page.getByText("Activa", { exact: true })).toBeVisible();
  await expect(page.getByText("Lenta", { exact: true })).toBeVisible();
  await expect(page.getByText("Sin respuesta", { exact: true })).toBeVisible();
  await expect(page.getByText("420 ms")).toBeVisible();
});

test("si el estado falla, lo dice sin romper la pantalla", async ({ page }) => {
  await page.route("**/api/admin/health", (r) =>
    r.fulfill({ status: 429, json: { error: "x" } }),
  );
  await openCard(page);
  await page.getByRole("button", { name: "Revisar ahora" }).click();
  await expect(
    page.getByText("Demasiadas consultas seguidas. Esperá un minuto."),
  ).toBeVisible();
});

test("probar avisos simula por defecto y no muestra datos personales", async ({
  page,
}) => {
  const bodies: Record<string, unknown>[] = [];
  await page.route("**/api/admin/notify", (r) => {
    bodies.push(r.request().postDataJSON());
    return r.fulfill({
      json: {
        dryRun: true,
        results: [
          { channel: "webhook", status: "dry-run", attempted: 1, delivered: 0 },
          {
            channel: "email",
            status: "skipped",
            attempted: 0,
            delivered: 0,
            error: "persona@ejemplo.com",
          },
          {
            channel: "whatsapp",
            status: "not-configured",
            attempted: 0,
            delivered: 0,
          },
        ],
      },
    });
  });
  await openCard(page);
  await expect(
    page.getByRole("checkbox", { name: "Solo simular, no enviar" }),
  ).toBeChecked();
  await page.getByLabel("Título").fill("Prueba");
  await page.getByLabel("Mensaje").fill("Mensaje de prueba");
  await page
    .getByRole("button", { name: "Probar avisos", exact: true })
    .click();
  await expect(page.getByText("Simulación: no se envió nada.")).toBeVisible();
  await expect(page.getByText("Simulado", { exact: true })).toBeVisible();
  await expect(page.getByText("Omitido", { exact: true })).toBeVisible();
  await expect(page.getByText("No configurado", { exact: true })).toBeVisible();
  await expect(page.getByText("persona@ejemplo.com")).toHaveCount(0);
  expect(bodies).toHaveLength(1);
  expect(bodies[0]).toMatchObject({
    title: "Prueba",
    dryRun: true,
    channels: ["webhook", "email", "whatsapp"],
  });
});

test("un envío real pide confirmación en la página y se manda una sola vez", async ({
  page,
}) => {
  const bodies: Record<string, unknown>[] = [];
  await page.route("**/api/admin/notify", async (r) => {
    bodies.push(r.request().postDataJSON());
    await new Promise((ok) => setTimeout(ok, 300));
    return r.fulfill({
      json: {
        dryRun: false,
        results: [
          { channel: "webhook", status: "sent", attempted: 1, delivered: 1 },
        ],
      },
    });
  });
  await openCard(page);
  await page.getByLabel("Título").fill("Real");
  await page.getByLabel("Mensaje").fill("Aviso real");
  await page.getByRole("checkbox", { name: "Correo" }).uncheck();
  await page.getByRole("checkbox", { name: "WhatsApp" }).uncheck();
  await page
    .getByRole("checkbox", { name: "Solo simular, no enviar" })
    .uncheck();
  await page.getByRole("button", { name: "Enviar de verdad" }).click();
  expect(bodies).toHaveLength(0); // nothing goes out before the confirmation
  await expect(page.getByText(/Se va a mandar un aviso real/)).toBeVisible();
  await page.getByRole("button", { name: "Sí, enviar ahora" }).dblclick();
  await expect(page.getByText("Envío real realizado.")).toBeVisible();
  await expect(page.getByText("Enviado", { exact: true })).toBeVisible();
  expect(bodies).toHaveLength(1);
  expect(bodies[0]).toMatchObject({ dryRun: false, channels: ["webhook"] });
});

test("sin título o sin canales no se llama al servidor", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/admin/notify", (r) => {
    calls += 1;
    return r.fulfill({ json: { dryRun: true, results: [] } });
  });
  await openCard(page);
  await page
    .getByRole("button", { name: "Probar avisos", exact: true })
    .click();
  await expect(
    page.getByText("Completá el título y el mensaje."),
  ).toBeVisible();
  await page.getByLabel("Título").fill("x");
  await page.getByLabel("Mensaje").fill("y");
  for (const c of ["Webhook", "Correo", "WhatsApp"])
    await page.getByRole("checkbox", { name: c }).uncheck();
  await page
    .getByRole("button", { name: "Probar avisos", exact: true })
    .click();
  await expect(page.getByText("Elegí al menos un canal.")).toBeVisible();
  expect(calls).toBe(0);
});
