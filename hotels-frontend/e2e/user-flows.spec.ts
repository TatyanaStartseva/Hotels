import { test, expect, Page, APIRequestContext } from "@playwright/test";

function uniqueEmail(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}@example.com`;
}

function formatDate(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

async function registerViaApi(
  request: APIRequestContext,
  email: string,
  password: string,
) {
  const response = await request.post("http://127.0.0.1:8000/auth/register", {
    data: { email, password },
  });

  expect(response.ok()).toBeTruthy();
}

async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: /вход/i })).toBeVisible();

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

  await expect(page.getByRole("heading", { name: /отели/i })).toBeVisible();

  const token = await page.evaluate(() => localStorage.getItem("token"));
  expect(token).toBeTruthy();
}

test.describe("", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("регистрация через UI переводит пользователя обратно к форме входа и показывает успешное сообщение", async ({
    page,
  }) => {
    const email = uniqueEmail("register_ui");
    const password = "secret123";

    await page.goto("/login");

    await page.getByRole("button", { name: /перейти к регистрации/i }).click();
    await expect(page.getByRole("heading", { name: /регистрация/i })).toBeVisible();

    await page.getByPlaceholder("Введите email").fill(email);
    await page.getByPlaceholder("Введите пароль").fill(password);

    const registerResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes("/auth/register") &&
        response.request().method() === "POST"
      );
    });

    await page.getByRole("button", { name: /зарегистрироваться/i }).click();

    const registerResponse = await registerResponsePromise;
    expect(registerResponse.status()).toBe(200);

    await expect(
      page.getByText(/регистрация прошла успешно\. теперь войдите в аккаунт\./i),
    ).toBeVisible();

    await expect(page.getByRole("heading", { name: /вход/i })).toBeVisible();

    await expect(page.getByPlaceholder("Введите email")).toHaveValue(email);
    await expect(page.getByPlaceholder("Введите пароль")).toHaveValue("");
  });

  test("успешный вход через UI сохраняет токен, загружает профиль и показывает страницу отелей", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("login_ui");
    const password = "secret123";

    await registerViaApi(request, email, password);

    await page.goto("/login");
    await page.getByPlaceholder("Введите email").fill(email);
    await page.getByPlaceholder("Введите пароль").fill(password);

    const loginResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes("/auth/login") &&
        response.request().method() === "POST"
      );
    });

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

    await page.getByRole("button", { name: /^Войти$/i }).click();

    const loginResponse = await loginResponsePromise;
    expect(loginResponse.status()).toBe(200);

    const meResponse = await meResponsePromise;
    expect(meResponse.status()).toBe(200);

    const hotelsResponse = await hotelsResponsePromise;
    expect(hotelsResponse.status()).toBe(200);

    await expect(page.getByRole("heading", { name: /отели/i })).toBeVisible();

    const token = await page.evaluate(() => localStorage.getItem("token"));
    expect(token).toBeTruthy();

    await expect(page).not.toHaveURL(/\/login$/);
  });



  test("поиск по городу отправляет запрос на backend и отображает либо найденные отели, либо корректное пустое состояние", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("search_city");
    const password = "secret123";

    await registerViaApi(request, email, password);
    await loginViaUi(page, email, password);

    await page.goto("/");

    const cityInput = page.getByPlaceholder(/город/i).first();
    await expect(cityInput).toBeVisible();

    await cityInput.fill("Москва");
    await expect(cityInput).toHaveValue("Москва");

    const citySearchResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes("/hotels") &&
        response.url().includes("location=") &&
        response.request().method() === "GET"
      );
    });

    await page.getByRole("button", { name: /найти по городу/i }).click();

    const citySearchResponse = await citySearchResponsePromise;
    expect(citySearchResponse.status()).toBe(200);

    await expect(page.getByRole("heading", { name: /отели/i })).toBeVisible();
    await expect(cityInput).toHaveValue("Москва");

    const hotelLinks = page.locator('a[href^="/hotels/"]');
    const emptyMessage = page.locator(".hotels-message");

    await expect(async () => {
      const linksCount = await hotelLinks.count();
      const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);
      expect(linksCount > 0 || hasEmptyMessage).toBeTruthy();
    }).toPass();
  });

  test("поиск по названию отправляет запрос на backend и сохраняет результат в UI", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("search_title");
    const password = "secret123";

    await registerViaApi(request, email, password);
    await loginViaUi(page, email, password);

    await page.goto("/");

    const titleInput = page.getByPlaceholder(/название отеля/i);
    await expect(titleInput).toBeVisible();

    await titleInput.fill("Sochi");
    await expect(titleInput).toHaveValue("Sochi");

    const titleSearchResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes("/hotels") &&
        response.request().method() === "GET"
      );
    });

    await page.getByRole("button", { name: /найти по названию/i }).click();

    const titleSearchResponse = await titleSearchResponsePromise;
    expect(titleSearchResponse.status()).toBe(200);

    await expect(page.getByRole("heading", { name: /отели/i })).toBeVisible();
    await expect(titleInput).toHaveValue("Sochi");

    const hotelLinks = page.locator('a[href^="/hotels/"]');
    const emptyMessage = page.locator(".hotels-message");

    await expect(async () => {
      const linksCount = await hotelLinks.count();
      const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);
      expect(linksCount > 0 || hasEmptyMessage).toBeTruthy();
    }).toPass();
  });

  test("после логина пользователь может открыть страницу своих бронирований и видит либо список, либо пустое состояние", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("bookings_page");
    const password = "secret123";

    await registerViaApi(request, email, password);
    await loginViaUi(page, email, password);

    const bookingsResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes("/bookings/me") &&
        response.request().method() === "GET"
      );
    });

    await page.goto("/bookings");

    const bookingsResponse = await bookingsResponsePromise;
    expect(bookingsResponse.status()).toBe(200);

    await expect(
      page.getByRole("heading", { name: /мои бронирования/i }),
    ).toBeVisible();

    const deleteButtons = page.getByRole("button", { name: /удалить/i });
    const emptyMessage = page.locator(".bookings-message");

    await expect(async () => {
      const count = await deleteButtons.count();
      const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);
      expect(count > 0 || hasEmptyMessage).toBeTruthy();
    }).toPass();
  });
});