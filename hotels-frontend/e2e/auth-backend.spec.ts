import { test, expect } from "@playwright/test";

test.describe("", () => {
  const email = `user_${Date.now()}@example.com`;
  const password = "secret123";

  test.beforeAll(async ({ request }) => {
    const registerResponse = await request.post("http://127.0.0.1:8000/auth/register", {
      data: {
        email,
        password,
      },
    });

    expect(registerResponse.ok()).toBeTruthy();
  });

  test("успешный вход через UI выполняет авторизацию на бэкенде", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByPlaceholder("Введите email").fill(email);
    await page.getByPlaceholder("Введите пароль").fill(password);

    const loginResponsePromise = page.waitForResponse((response) => {
      return response.url().includes("/auth/login") && response.request().method() === "POST";
    });

    await page.getByRole("button", { name: /войти/i }).click();

    const loginResponse = await loginResponsePromise;
    expect(loginResponse.status()).toBe(200);

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: /Отели/i })).toBeVisible();
  });
});