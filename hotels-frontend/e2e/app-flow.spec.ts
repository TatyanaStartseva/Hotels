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

  test("1. пользователь регистрируется через UI и видит сообщение об успешной регистрации", async ({ page }) => {
    const email = uniqueEmail("register_ui");
    const password = "secret123";

    await page.goto("/login");

    await page.getByRole("button", { name: /Перейти к регистрации/i }).click();
    await expect(page.getByRole("heading", { name: /Регистрация/i })).toBeVisible();

    await page.getByPlaceholder("Введите email").fill(email);
    await page.getByPlaceholder("Введите пароль").fill(password);

    const registerResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes("/auth/register") &&
        response.request().method() === "POST"
      );
    });

    await page.getByRole("button", { name: /Зарегистрироваться/i }).click();

    const registerResponse = await registerResponsePromise;
    expect(registerResponse.status()).toBe(200);

    await expect(
      page.getByText(/Регистрация прошла успешно\. Теперь войдите в аккаунт\./i)
    ).toBeVisible();

    await expect(page.getByRole("heading", { name: /Вход/i })).toBeVisible();
  });

  test("2. пользователь входит через UI, backend возвращает токен, и в интерфейсе открывается страница отелей", async ({ page, request }) => {
    const email = uniqueEmail("login_ui");
    const password = "secret123";

    await registerViaApi(request, email, password);
    await loginViaUi(page, email, password);

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: /Отели/i })).toBeVisible();
  });

  test("3. после входа главная страница загружает профиль пользователя и список отелей, а результат отображается в UI", async ({ page, request }) => {
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

  test("4. пользователь ищет отели по городу, запрос уходит на backend, а результат поиска отображается на странице", async ({ page, request }) => {
    const email = uniqueEmail("search_city");
    const password = "secret123";

    await registerViaApi(request, email, password);
    await loginViaUi(page, email, password);

    await page.goto("/");

    const cityInput = page.getByPlaceholder(/Город/i);
    await cityInput.fill("Москва");

    const citySearchResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes("/hotels") &&
        response.url().includes("location=") &&
        response.request().method() === "GET"
      );
    });

    await page.getByRole("button", { name: /Найти по городу/i }).click();

    const citySearchResponse = await citySearchResponsePromise;
    expect(citySearchResponse.status()).toBeLessThan(500);

    await expect(cityInput).toHaveValue("Москва");

    const hotelCards = page.locator('a[href^="/hotels/"]');
    const message = page.locator(".hotels-message");

    await expect(async () => {
      const cardsCount = await hotelCards.count();
      const messageVisible = await message.isVisible().catch(() => false);
      expect(cardsCount > 0 || messageVisible).toBeTruthy();
    }).toPass();
  });

 test("5. пользователь ищет отели по названию, запрос уходит на backend, а результат поиска отображается в UI", async ({ page, request }) => {
  const email = uniqueEmail("search_title");
  const password = "secret123";

  await registerViaApi(request, email, password);
  await loginViaUi(page, email, password);

  await page.goto("/");

  const titleInput = page.getByPlaceholder(/Название отеля/i);
  await expect(titleInput).toBeVisible();

  await titleInput.fill("Test");
  await expect(titleInput).toHaveValue("Test");

  const titleSearchResponsePromise = page.waitForResponse((response) => {
    return (
      response.url().includes("/hotels") &&
      response.request().method() === "GET"
    );
  });

  await page.getByRole("button", { name: /Найти по названию/i }).click();

  const titleSearchResponse = await titleSearchResponsePromise;
  expect(titleSearchResponse.status()).toBeLessThan(500);

  await expect(titleInput).toHaveValue("Test");
  await expect(page.getByRole("heading", { name: /Отели/i })).toBeVisible();

  const hotelCards = page.locator('a[href^="/hotels/"]');
  const message = page.locator(".hotels-message");

  await expect(async () => {
    const cardsCount = await hotelCards.count();
    const messageVisible = await message.isVisible().catch(() => false);
    expect(cardsCount > 0 || messageVisible).toBeTruthy();
  }).toPass();
});

test("6. после авторизации пользователь повторно открывает главную страницу, frontend снова загружает список отелей через backend, а UI отображает страницу отелей", async ({ page, request }) => {
  const email = uniqueEmail("home_reload");
  const password = "secret123";

  await registerViaApi(request, email, password);
  await loginViaUi(page, email, password);

  const hotelsResponsePromise = page.waitForResponse((response) => {
    return (
      response.url().includes("/hotels") &&
      response.request().method() === "GET"
    );
  });

  await page.goto("/");

  const hotelsResponse = await hotelsResponsePromise;
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