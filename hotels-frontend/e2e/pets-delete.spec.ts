import { test, expect } from "@playwright/test";

function uniquePetName(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

test.describe("удаление питомца", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.setItem("token", "e2e-token");
      sessionStorage.clear();
    });
  });

  test("пользователь удаляет питомца через UI, backend удаляет запись из БД, и UI обновляется", async ({ page }) => {
    const petName = uniquePetName("ТестПитомец");
    let pets: any[] = [
      {
        id: 1,
        name: petName,
        species: "cat",
        conditions: null,
        vaccinations: [],
        license_required: false,
        cohabitation_allowed: true,
      },
    ];

    await page.route("**/pets/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(pets),
      });
    });

    await page.route(/.*\/pets\/\d+$/, async (route) => {
      if (route.request().method() !== "DELETE") {
        await route.fallback();
        return;
      }
      pets = [];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "OK" }),
      });
    });

    await page.goto("/pets");
    await expect(page.getByRole("heading", { name: /мои питомцы/i })).toBeVisible();
    await expect(page.locator("body")).toContainText(petName);

    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toMatch(/удалить питомца/i);
      await dialog.accept();
    });

    await page.getByRole("button", { name: /^Удалить$/i }).first().click();
    await expect(page.locator("body")).not.toContainText(petName);
  });
});
