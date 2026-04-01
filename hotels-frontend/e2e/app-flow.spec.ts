import { test, expect, Page, APIRequestContext } from "@playwright/test";

function uniqueEmail(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}@example.com`;
}

function formatDate(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

async function registerViaApi(request: APIRequestContext, email: string, password: string) {
  const response = await request.post("http://127.0.0.1:8000/auth/register", {
    data: { email, password },
  });

  expect(response.ok()).toBeTruthy();
}

async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto("/login");

  await page.getByPlaceholder("Введите email").fill(email);
  await page.getByPlaceholder("Введите пароль").fill(password);

  const loginResponsePromise = page.waitForResponse((response) => {
    return (
      response.url().includes("/auth/login") &&
      response.request().method() === "POST"
    );
  });

  await page.getByRole("button", { name: /^Войти$/i }).click();

  const loginResponse = await loginResponsePromise;
  expect(loginResponse.status()).toBe(200);

  await expect(page.getByRole("heading", { name: /Отели/i })).toBeVisible();
}

test.describe("E2E: сквозные пользовательские сценарии", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("после входа главная страница загружает профиль пользователя и список отелей, а результат отображается в UI", async ({ page, request }) => {
    const email = uniqueEmail("home_load");
    const password = "secret123";

    await registerViaApi(request, email, password);
    await loginViaUi(page, email, password);

    const meResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes("/auth/me") &&
        response.request().method() === "GET"
      );
    });

    const hotelsResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes("/hotels") &&
        response.request().method() === "GET"
      );
    });

    await page.goto("/");

    const meResponse = await meResponsePromise;
    const hotelsResponse = await hotelsResponsePromise;

    expect(meResponse.status()).toBeLessThan(500);
    expect(hotelsResponse.status()).toBeLessThan(500);

    await expect(page.getByRole("heading", { name: /Отели/i })).toBeVisible();

    const hotelCards = page.locator('a[href^="/hotels/"]');
    const message = page.locator(".hotels-message");

    await expect(async () => {
      const cardsCount = await hotelCards.count();
      const messageVisible = await message.isVisible().catch(() => false);
      expect(cardsCount > 0 || messageVisible).toBeTruthy();
    }).toPass();
  });



});