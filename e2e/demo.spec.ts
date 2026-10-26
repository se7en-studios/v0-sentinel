import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "./fixtures";

// Public presentation mode (/demo): six guided scenes, sample data only, no admin or satellite calls.
const TITLES = [
  "Un satélite ve calor desde el espacio",
  "Sentinel separa el fuego del ruido",
  "Avisa antes de que pase el satélite polar",
  "Marcás tu zona y Sentinel te avisa",
  "Del aviso a la acción",
  "Dónde se puede usar Sentinel",
];
const SAMPLE = "Datos de ejemplo para esta presentación";
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

const title = (page: Page, n: number) =>
  expect(page.getByRole("heading", { level: 1 })).toHaveText(TITLES[n]);

test("recorre los 6 pasos con botones, teclado y clics sin llamar a la API", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const calls: string[] = [];
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (
      u.pathname.startsWith("/api/") ||
      /firms|nasa\.gov|inpe/i.test(u.hostname)
    )
      calls.push(u.pathname + u.hostname);
  });
  await page.goto("/demo");
  expect(
    await page.locator('meta[name="robots"]').getAttribute("content"),
  ).toContain("noindex");
  // first visit: the optional audience screen comes first
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("¿Con quién estás hablando?");
  await page.getByRole("button", { name: "Saltear" }).click();
  await title(page, 0);
  await expect(page.getByText(SAMPLE)).toBeVisible();

  // 1 -> 2 by button
  await page.getByRole("button", { name: "Siguiente" }).click();
  await title(page, 1);
  await expect(page.getByText(/instalación industrial/)).toBeVisible();

  // 2 -> 3 by keyboard; pick a confidence level
  await page.keyboard.press("ArrowRight");
  await title(page, 2);
  await page.getByRole("button", { name: "Alta" }).click();
  await expect(
    page.getByText("Se sostuvo muchas veces seguidas: es la más firme."),
  ).toBeVisible();
  await expect(page.getByText(/minutos antes|%/)).toHaveCount(0);

  // 3 -> 4; draw the sample zone, the mock alert shows up
  await page.keyboard.press("ArrowRight");
  await title(page, 3);
  await expect(page.getByText("Acá va a llegar tu aviso")).toBeVisible();
  await page
    .getByRole("button", { name: "Dibujar una zona de ejemplo" })
    .click();
  await expect(page.getByText("Alerta en Mi zona")).toBeVisible();
  await page.getByRole("button", { name: "Probar con otra zona" }).click();
  await expect(page.getByText("Alerta en Mi zona")).toBeVisible();

  // 4 -> 5; move the incident along and open the report
  await page.getByRole("button", { name: "Siguiente" }).click();
  await title(page, 4);
  await page.getByRole("button", { name: "Controlado" }).click();
  await expect(
    page.getByRole("button", { name: "Controlado" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByText("La brigada informó que el fuego está controlado").first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ver informe de ejemplo" }).click();
  await expect(
    page.getByRole("heading", { name: "Informe del incidente" }),
  ).toBeVisible();

  // 5 -> 6; same contact destination as the landing
  await page.keyboard.press("ArrowRight");
  await title(page, 5);
  await expect(
    page.getByRole("link", { name: "Solicitar reunión" }),
  ).toHaveAttribute("href", "https://linktr.ee/sentinelarg");
  await expect(page.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  await expect(page.getByText(SAMPLE)).toBeVisible();

  // back with the keyboard, then jump with the step list
  await page.keyboard.press("ArrowLeft");
  await title(page, 4);
  await page.getByRole("button", { name: /^3\s+Avisa antes/ }).click();
  await title(page, 2);
  expect(page.url()).toContain("#3");

  // language switch keeps the scene
  await page.getByRole("button", { name: "English" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "It warns before the polar satellite passes",
  );
  await expect(
    page.getByText("Sample data for this presentation"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Português" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Avisa antes de o satélite polar passar",
  );

  expect(calls).toEqual([]);
});

test("el hash abre el paso y un clic en el mapa dibuja la zona", async ({
  page,
}) => {
  await page.goto("/demo#4");
  await title(page, 3);
  const map = page.getByRole("img", {
    name: "Mapa de Argentina con datos de ejemplo",
  });
  const box = (await map.boundingBox())!;
  // roughly the Córdoba hills: a point inside the country for any reasonable layout
  await page.mouse.click(box.x + box.width * 0.55, box.y + box.height * 0.45);
  await expect(page.getByText("Alerta en Mi zona")).toBeVisible();
});

const firstCard = (page: Page) => page.locator(".d-cases h2").first();

test("elegir un perfil reordena casos, cambia textos, persiste y se puede cambiar sin perder el paso", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: "Municipio o defensa civil" }).click();
  await title(page, 0);
  await page.goto("/demo#4");
  await expect(page.getByText("un barrio")).toBeVisible();
  await page.goto("/demo#5");
  await expect(page.getByText("Equipo de defensa civil de ejemplo")).toBeVisible();
  await page.goto("/demo#6");
  await expect(firstCard(page)).toHaveText("Municipios y defensa civil");
  await expect(page.getByText(/qué territorio/)).toBeVisible();

  await page.reload();
  await title(page, 5);
  await expect(firstCard(page)).toHaveText("Municipios y defensa civil");

  // change from the header: same step, investment keeps the default order but changes the closing
  await page.getByRole("button", { name: "Cambiar público" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("¿Con quién estás hablando?");
  await page.getByRole("button", { name: "Inversión o alianzas" }).click();
  await title(page, 5);
  await expect(firstCard(page)).toHaveText("Producción forestal");
  await expect(page.getByText(/una alianza/)).toBeVisible();
});

test("saltear no cambia nada y no vuelve a preguntar", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: "Saltear" }).click();
  await title(page, 0);
  await page.goto("/demo#5");
  await expect(page.getByText("Brigada de ejemplo")).toBeVisible();
  await page.goto("/demo#6");
  await expect(firstCard(page)).toHaveText("Producción forestal");
  await expect(page.getByText("Contanos qué necesitás cuidar y lo conversamos.")).toBeVisible();
  await page.reload();
  await title(page, 5);
});

test("a11y axe de la pantalla de perfiles", async ({ page }) => {
  for (const scheme of ["light", "dark"] as const)
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ reducedMotion: "reduce", colorScheme: scheme });
      await page.goto("/demo");
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("¿Con quién estás hablando?");
      const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
    }
});

test("la paleta del admin ofrece abrir el modo presentación", async ({
  page,
  context,
}) => {
  test.setTimeout(120_000);
  await page.goto("/admin");
  await page
    .getByRole("button", { name: "O probá con datos de ejemplo" })
    .click()
    .catch(() => {});
  await page.keyboard.press("Control+k");
  const [popup] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("dialog").getByText("Modo presentación").click(),
  ]);
  await popup.waitForURL(/\/demo$/);
});

for (const size of [
  { name: "390", width: 390, height: 844 },
  { name: "1440", width: 1440, height: 800 },
]) {
  for (const scheme of ["light", "dark"] as const) {
    test(`a11y axe demo ${size.name}px ${scheme}`, async ({ page }) => {
      test.setTimeout(180_000);
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.emulateMedia({ reducedMotion: "reduce", colorScheme: scheme });
      const failures: string[] = [];
      for (let i = 0; i < TITLES.length; i++) {
        await page.goto(`/demo#${i + 1}`);
        await title(page, i);
        if (i === 3)
          await page
            .getByRole("button", { name: "Dibujar una zona de ejemplo" })
            .click();
        if (i === 4)
          await page
            .getByRole("button", { name: "Ver informe de ejemplo" })
            .click();
        const { violations } = await new AxeBuilder({ page })
          .withTags(TAGS)
          .analyze();
        for (const v of violations)
          if (v.impact === "serious" || v.impact === "critical")
            failures.push(
              `[${i + 1}] ${v.impact} ${v.id}: ${v.nodes
                .slice(0, 3)
                .map((n) => n.target.join(" "))
                .join(" | ")}`,
            );
      }
      expect(failures, failures.join("\n")).toEqual([]);
    });
  }
}
