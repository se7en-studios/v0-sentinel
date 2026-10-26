import { expect, test, type Page } from "./fixtures";
import { openTab } from "./tab";

// Alerts by email / WhatsApp: what the person sees before turning them on, and what goes out when a rule is met.
// /api/admin/notify is always stubbed: nothing here reaches a real provider.

const KEY = "sentinel-admin-workspace-v1";
const MIN = 60_000;

async function seed(page: Page, settings: Record<string, unknown>) {
  await page.addInitScript(
    ([key, value]) => {
      try {
        if (!sessionStorage.getItem("seeded")) {
          localStorage.clear();
          localStorage.setItem(key, value);
          sessionStorage.setItem("seeded", "1");
        }
      } catch {
        /* private mode */
      }
    },
    [KEY, JSON.stringify({ settings: { onboarded: true, ...settings } })],
  );
}

const card = (page: Page) =>
  page
    .locator("section, div")
    .filter({
      has: page.getByRole("heading", { name: "Avisos por correo y WhatsApp" }),
    });

test.describe("antes de activar", () => {
  test("muestra el texto real, el estado del servidor y qué cargar", async ({
    page,
  }) => {
    await seed(page, {
      notify: { email: "yo@ejemplo.com", whatsapp: "+5492991234567" },
    });
    await page.route("**/api/admin/notify", (r) =>
      r.fulfill({
        json: {
          dryRun: true,
          results: [
            { channel: "email", status: "dry-run", attempted: 1, delivered: 0 },
            {
              channel: "whatsapp",
              status: "not-configured",
              attempted: 0,
              delivered: 0,
            },
          ],
        },
      }),
    );
    await page.goto("/admin");
    await openTab(page, /^(Configuración|Config)/);
    await expect(page.getByText("Correo: yo@ejemplo.com")).toBeVisible();
    await expect(page.getByText("WhatsApp: +5492991234567")).toBeVisible();

    // the preview is the real message: what happened, when, what to do
    const email = page.getByRole("region", { name: "Correo" });
    await expect(email).toContainText("[Sentinel] Fuego cerca de tu zona");
    await expect(email).toContainText("Qué pasó:");
    await expect(email).toContainText("Cuándo:");
    await expect(email).toContainText("Qué hacer:");
    await page
      .getByLabel("Tipo de aviso")
      .selectOption({ label: "Riesgo de incendio alto en los próximos días" });
    await expect(email).toContainText("Zona del mapa:");
    const wa = page.getByRole("region", { name: "WhatsApp (una sola línea)" });
    await expect(wa).toContainText(
      "Riesgo de incendio alto en los próximos días",
    );

    await page.getByRole("button", { name: "Revisar si está listo" }).click();
    await expect(page.getByText("Listo para enviar")).toBeVisible();
    await expect(page.getByText("Falta configurar el servidor")).toBeVisible();
    await expect(
      page.getByText("WHATSAPP_TOKEN", { exact: false }),
    ).toBeVisible();
  });

  test("empieza apagado, pide un contacto válido y recuerda la elección", async ({
    page,
  }) => {
    await seed(page, { notify: { email: "esto-no-es-un-correo" } });
    await page.goto("/admin");
    await openTab(page, /^(Configuración|Config)/);
    const toggle = page.getByRole("checkbox", {
      name: /Mandar mis avisos por correo y WhatsApp/,
    });
    await expect(
      page.getByText("Este dato no parece válido: esto-no-es-un-correo"),
    ).toBeVisible();
    await expect(toggle).not.toBeChecked();
    await toggle.click({ force: true });
    await expect(toggle).not.toBeChecked(); // nothing valid to send to
    await expect(
      page.getByText("Cargá primero un correo o un WhatsApp válido."),
    ).toBeVisible();

    await page.getByLabel("Correo para los avisos").fill("yo@ejemplo.com");
    await toggle.check({ force: true });
    await expect(toggle).toBeChecked();
    await page.reload();
    await openTab(page, /^(Configuración|Config)/);
    await expect(
      page.getByRole("checkbox", {
        name: /Mandar mis avisos por correo y WhatsApp/,
      }),
    ).toBeChecked();
  });

  test("los límites se guardan y no pasan de lo permitido", async ({
    page,
  }) => {
    await seed(page, { notify: { email: "yo@ejemplo.com" } });
    await page.goto("/admin");
    await openTab(page, /^(Configuración|Config)/);
    await page
      .getByLabel("Como mucho un mensaje por regla cada")
      .selectOption({ label: "6 horas" });
    const perDay = page.getByLabel(/Como mucho \d+ mensajes por día/);
    await perDay.fill("9999");
    await expect(perDay).toHaveValue("50");
    await perDay.fill("0");
    await expect(perDay).toHaveValue("1");
  });
});

test.describe("al cumplirse una regla", () => {
  async function setup(page: Page) {
    const state = { withFire: false };
    const sent: Record<string, unknown>[] = [];
    await seed(page, {
      rules: [{ id: "r1", enabled: true, kind: "activity", focos: 1 }],
      notify: {
        email: "yo@ejemplo.com",
        deliver: true,
        minIntervalMin: 60,
        maxPerDay: 10,
      },
    });
    await page.route("**/api/admin/early", (r) =>
      r.fulfill({
        json: {
          updated: new Date().toISOString(),
          fetchedAt: Date.now(),
          early: [],
          sources: [],
        },
      }),
    );
    await page.route("**/api/admin/fires", (r) => {
      const at = new Date(Date.now() - 20 * MIN);
      const hhmm = Number(
        `${String(at.getUTCHours()).padStart(2, "0")}${String(at.getUTCMinutes()).padStart(2, "0")}`,
      );
      return r.fulfill({
        json: {
          updated: new Date().toISOString(),
          days: [at.toISOString().slice(0, 10)],
          points: state.withFire ? [[-41.1, -71.3, 12, 1, 0, hhmm, 0]] : [],
          clusters: [],
          fetchedAt: Date.now(),
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
      });
    });
    await page.route("**/api/admin/notify", async (r) => {
      sent.push(JSON.parse(r.request().postData() ?? "{}"));
      await r.fulfill({
        json: {
          dryRun: false,
          results: [
            { channel: "email", status: "sent", attempted: 1, delivered: 1 },
          ],
        },
      });
    });
    await page.goto("/admin");
    await expect(page.getByRole("navigation", { name: "Modos" })).toBeVisible();
    return { state, sent };
  }

  const refresh = async (page: Page) => {
    await page.getByRole("button", { name: "Actualizar datos" }).click();
    await page.waitForTimeout(1500);
  };

  test("manda el aviso con qué pasó y qué hacer, y respeta la frecuencia mínima", async ({
    page,
  }) => {
    const { state, sent } = await setup(page);
    await page.waitForTimeout(2500); // the first load only sets the baseline: what is already true is not news

    state.withFire = true;
    await refresh(page);
    await expect(page.getByText("Aviso enviado por Correo")).toBeVisible({
      timeout: 20_000,
    });
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      channels: ["email"],
      emails: ["yo@ejemplo.com"],
      severity: "info",
    });
    expect(sent[0].phones).toEqual([]);
    expect(String(sent[0].title)).toContain("Mucha actividad de focos");
    expect(String(sent[0].message)).toContain("Qué pasó:");
    expect(String(sent[0].message)).toContain("Qué hacer:");
    expect(sent[0]).not.toHaveProperty("dryRun", true);

    // the rule turns false and true again within the hour: shown on screen, not sent again
    state.withFire = false;
    await refresh(page);
    state.withFire = true;
    await refresh(page);
    await expect(
      page.getByText(
        "Aviso no enviado: ya mandamos uno de esta regla hace poco.",
      ),
    ).toBeVisible({ timeout: 20_000 });
    expect(sent).toHaveLength(1);
  });

  test("con el envío apagado no sale nada", async ({ page }) => {
    const { state, sent } = await setup(page);
    await page.evaluate((key) => {
      const ws = JSON.parse(localStorage.getItem(key) ?? "{}");
      ws.settings = {
        ...ws.settings,
        notify: { ...ws.settings.notify, deliver: false },
      };
      localStorage.setItem(key, JSON.stringify(ws));
    }, KEY);
    await page.reload();
    await expect(page.getByRole("navigation", { name: "Modos" })).toBeVisible();
    await page.waitForTimeout(2500);
    state.withFire = true;
    await refresh(page);
    await page.waitForTimeout(1500);
    expect(sent).toHaveLength(0);
  });
});
