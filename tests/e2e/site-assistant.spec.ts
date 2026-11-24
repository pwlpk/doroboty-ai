import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("site assistant answers a question with keyboard access and no horizontal scroll", async ({
  page,
}) => {
  const sent: unknown[] = [];
  await page.route("**/api/chat", async (route) => {
    sent.push(route.request().postDataJSON());
    await route.fulfill({
      json: {
        reply:
          "Publikujemy role, w których AI zmienia pracę i wynik da się zobaczyć.\n\nSzczegóły: #/metodologia",
      },
    });
  });
  await page.goto("/#/");
  const launcher = page.getByRole("button", { name: "Zapytaj asystenta" });
  await expect(launcher).toBeVisible();
  await launcher.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog", { name: "Zapytaj o DoRoboty.ai" });
  const input = dialog.getByLabel("Twoje pytanie");
  await expect(input).toBeFocused();
  expect((await new AxeBuilder({ page }).include(".e-assistant").analyze()).violations).toEqual([]);

  await page.keyboard.press("Enter");
  await expect(dialog.getByText("Wpisz pytanie.")).toBeVisible();
  await input.fill("Jak wybieracie oferty?");
  await page.keyboard.press("Enter");
  await expect(dialog.getByText("Publikujemy role, w których AI zmienia pracę")).toBeVisible();
  expect(sent).toEqual([{ messages: [{ role: "user", content: "Jak wybieracie oferty?" }] }]);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(launcher).toBeFocused();

  await launcher.click();
  await dialog.getByRole("link", { name: "/metodologia" }).click();
  await expect(page).toHaveURL(/#\/metodologia$/);
  await expect(dialog).toBeHidden();
});

test("site assistant explains when it is switched off and keeps the question", async ({ page }) => {
  await page.route("**/api/chat", (route) =>
    route.fulfill({
      status: 503,
      json: { error: "Asystent nie jest jeszcze włączony w tej wersji strony." },
    }),
  );
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto("/#/oferty");
  await page.getByRole("button", { name: "Zapytaj asystenta" }).click();
  const dialog = page.getByRole("dialog", { name: "Zapytaj o DoRoboty.ai" });
  await dialog.getByRole("button", { name: "Jak zaaplikować na ofertę?" }).click();
  await expect(dialog.getByRole("alert")).toContainText("nie jest jeszcze włączony");
  await expect(dialog.getByLabel("Twoje pytanie")).toHaveValue("Jak zaaplikować na ofertę?");
  const box = await dialog.boundingBox();
  expect(box?.width).toBeLessThanOrEqual(375);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});

test("site assistant stays out of the signed-in workspace", async ({ page }) => {
  await page.goto("/#/auth/sign-in");
  await page.getByRole("button", { name: "Wejdź jako Anna Kowalska", exact: true }).click();
  await page.goto("/#/app");
  await expect(page.getByRole("button", { name: "Zapytaj asystenta" })).toHaveCount(0);
});
