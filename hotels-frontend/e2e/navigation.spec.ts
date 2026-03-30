import { test, expect } from "@playwright/test";

test.describe("Навигационные пользовательские сценарии", () => {
  test("пользователь может перейти с главной страницы на логин и вернуться назад через браузер", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Отели/i })).toBeVisible();

    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);

    await page.goBack();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: /Отели/i })).toBeVisible();
  });
});