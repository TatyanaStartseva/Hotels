import { test, expect } from "@playwright/test";

function uniquePetName(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

test.describe("E2E: питомцы", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.setItem("token", "e2e-token");
      sessionStorage.clear();
    });
  });

  test("пользователь добавляет питомца через UI, и он отображается после перезагрузки страницы", async ({ page }) => {
    const petName = uniquePetName("Барсик");
    let pets: any[] = [];

    await page.route("**/pets/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(pets),
      });
    });

    await page.route("**/pets", async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }

      const body = route.request().postDataJSON() as any;
      pets = [
        {
          id: 1,
          name: body.name,
          species: body.species,
          conditions: body.conditions,
          vaccinations: body.vaccinations ?? [],
          diet_type: null,
          diet_details: body.diet_details ?? null,
          feedings_per_day: null,
          license_required: body.license_required,
          cohabitation_allowed: body.cohabitation_allowed,
        },
      ];

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(pets[0]),
      });
    });

    await page.goto("/pets");

    await expect(page.getByRole("heading", { name: /мои питомцы/i })).toBeVisible();

    await page.getByPlaceholder("Имя питомца").fill(petName);
    const selects = page.locator("select");
    await selects.nth(0).selectOption("cat");
    await page.getByPlaceholder(/Например: нужен террариум, подогрев, тишина/i).fill("Тихое место, без сквозняков");
    await page.getByPlaceholder(/Например: сухой корм/i).fill("Сухой корм");
    await page.getByPlaceholder(/Через запятую: rabies, complex/i).fill("rabies, complex");
    await selects.nth(1).selectOption("false");
    await selects.nth(2).selectOption("true");
    await page.getByRole("button", { name: /добавить питомца/i }).click();

    await expect(page.locator("body")).toContainText(petName);
    await expect(page.locator("body")).toContainText("Кошка");
    await expect(page.locator("body")).toContainText("Тихое место, без сквозняков");

    await page.reload();
    await expect(page.locator("body")).toContainText(petName);
    await expect(page.locator("body")).toContainText("Тихое место, без сквозняков");
  });
});
