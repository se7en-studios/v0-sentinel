import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "./fixtures";
import { tab } from "./tab";

// The weekly PDF and the keyboard: what is new has to be reachable from the palette and the shortcuts.

const KEY = "sentinel-admin-workspace-v1";
const MIN = 60_000;

async function open(page: Page, settings: Record<string, unknown> = {}) {
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
  const at = new Date(Date.now() - 30 * MIN);
  const hhmm = Number(
    `${String(at.getUTCHours()).padStart(2, "0")}${String(at.getUTCMinutes()).padStart(2, "0")}`,
  );
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
  await page.route("**/api/admin/fires", (r) =>
    r.fulfill({
      json: {
        updated: new Date().toISOString(),
        days: [at.toISOString().slice(0, 10)],
        points: [[-41.1, -71.3, 12, 1, 0, hhmm, 0]],
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
    }),
  );
  await page.goto("/admin");
  await expect(page.getByRole("navigation", { name: "Modos" })).toBeVisible();
}

test("el reporte semanal se descarga como un PDF real", async ({ page }) => {
  await open(page, { org: "Estancia La Ñata" });
  const button = page.getByRole("button", {
    name: "Descargar reporte semanal (PDF)",
  });
  await expect(button).toBeEnabled({ timeout: 30_000 });
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    button.click(),
  ]);
  expect(download.suggestedFilename()).toMatch(
    /^sentinel-reporte-semanal-\d{4}-\d{2}-\d{2}\.pdf$/,
  );
  const path = await download.path();
  const bytes = await readFile(path);
  expect(bytes.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  expect(bytes.length).toBeGreaterThan(2000);
  await expect(page.getByText("Reporte descargado")).toBeVisible();
});

test("la paleta ofrece lo nuevo: reporte, modo simple, volver a elegir y los avisos", async ({
  page,
}) => {
  await open(page);
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog");
  const input = dialog.getByRole("combobox");
  for (const name of [
    "Descargar reporte semanal (PDF)",
    "Activar el modo simple",
    "Cambiar qué vigilo (volver a elegir)",
    "Configurar avisos por correo y WhatsApp",
  ]) {
    await input.fill(name.slice(0, 14));
    await expect(page.getByRole("option", { name })).toBeVisible();
  }
  // choosing one runs it: the simple mode drops the extra tabs from the bar
  await input.fill("modo simple");
  await page.getByRole("option", { name: "Activar el modo simple" }).click();
  await expect(tab(page, "Recursos")).toBeHidden();
  await page.keyboard.press("Control+k");
  await page.getByRole("dialog").getByRole("combobox").fill("modo simple");
  await expect(
    page.getByRole("option", { name: "Desactivar el modo simple" }),
  ).toBeVisible();
});

test("la paleta lleva a los avisos y vuelve a abrir la pregunta inicial", async ({
  page,
}) => {
  await open(page);
  await page.keyboard.press("Control+k");
  await page
    .getByRole("dialog")
    .getByRole("combobox")
    .fill("avisos por correo");
  await page
    .getByRole("option", { name: "Configurar avisos por correo y WhatsApp" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Avisos por correo y WhatsApp" }),
  ).toBeInViewport({ timeout: 15_000 });

  await page.keyboard.press("Control+k");
  await page.getByRole("dialog").getByRole("combobox").fill("qué vigilo");
  await page
    .getByRole("option", { name: "Cambiar qué vigilo (volver a elegir)" })
    .click();
  await expect(
    page.getByRole("heading", { name: "¿Qué querés vigilar?" }),
  ).toBeVisible();
});

test("g y una letra lleva a cada pantalla, también a Incendios", async ({
  page,
}) => {
  await open(page);
  await page.locator("body").click({ position: { x: 5, y: 5 } });
  await page.keyboard.press("g");
  await page.keyboard.press("f");
  await expect(tab(page, "Incendios")).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("g");
  await page.keyboard.press("z");
  await expect(tab(page, "Zonas")).toHaveAttribute("aria-current", "page");
});

test("la ayuda de atajos lista todas las pantallas, con Incendios", async ({
  page,
}) => {
  await open(page);
  await page.keyboard.press("Shift+?");
  const help = page.getByRole("dialog");
  await expect(help.getByText("Incendios")).toBeVisible();
  for (const name of [
    "Vista general",
    "Zonas",
    "Drones y sensores",
    "Recursos",
    "Pronóstico",
    "Incidentes",
    "Métricas",
    "Configuración",
  ])
    await expect(help.getByText(name, { exact: true })).toBeVisible();
});
