import { test, expect } from "@playwright/test";

test.describe("E2E: список отелей", () => {
  const email = `hotels_${Date.now()}@example.com`;
  const password = "secret123";

  test.beforeAll(async ({ request }) => {
    await request.post("http://127.0.0.1:8000/auth/register", {
      data: { email, password },
    });
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("Введите email").fill(email);
    await page.getByPlaceholder("Введите пароль").fill(password);
    await page.getByRole("button", { name: /войти/i }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("главная делает запрос в бек и показывает страницу", async ({ page }) => {
    const hotelsResponsePromise = page.waitForResponse((response) => {
      return response.url().includes("/hotels") && response.request().method() === "GET";
    });

    await page.goto("/");

    const hotelsResponse = await hotelsResponsePromise;
    expect(hotelsResponse.status()).toBeLessThan(500);

    await expect(page.getByRole("heading", { name: /Отели/i })).toBeVisible();
  });

  test("поиск по названию работает после логина", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.getByPlaceholder(/название отеля|название/i);
    await searchInput.fill("Test");

    await expect(searchInput).toHaveValue("Test");
  });
});