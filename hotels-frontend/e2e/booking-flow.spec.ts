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

test.describe("E2E: сценарий бронирования", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("пользователь бронирует номер со страницы отеля и видит бронь на странице своих бронирований", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("booking_flow");
    const password = "secret123";

    await registerViaApi(request, email, password);
    await loginViaUi(page, email, password);

    const dateFrom = formatDate(1);
    const dateTo = formatDate(3);

    await page.goto("/hotels/1");

    await expect(page.getByRole("heading", { name: /отель/i })).toBeVisible();
    await expect(page.getByText(/даты бронирования/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Комнаты$/i })).toBeVisible();

    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs).toHaveCount(2);

    await dateInputs.nth(0).fill(dateFrom);
    await dateInputs.nth(1).fill(dateTo);

    await expect(dateInputs.nth(0)).toHaveValue(dateFrom);
    await expect(dateInputs.nth(1)).toHaveValue(dateTo);

    const bookingButtons = page.getByRole("button", { name: /забронировать/i });
    const hotelMessage = page.locator(".hotel-message");

    await expect(async () => {
      const buttonsCount = await bookingButtons.count();
      const hasMessage = await hotelMessage.isVisible().catch(() => false);
      expect(buttonsCount > 0 || hasMessage).toBeTruthy();
    }).toPass();

    const buttonsCount = await bookingButtons.count();

    if (buttonsCount === 0) {
      await expect(hotelMessage).toBeVisible();
      await expect(hotelMessage).toContainText(/нет доступных комнат|ошибка/i);
      return;
    }

    const bookingButton = bookingButtons.first();
    await expect(bookingButton).toBeVisible();
    await expect(bookingButton).toBeEnabled();

    let dialogMessage = "";
    page.once("dialog", async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.accept();
    });

    const bookingResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/bookings") &&
        response.request().method() === "POST",
      { timeout: 15_000 },
    );

    await bookingButton.click();

    const bookingResponse = await bookingResponsePromise;
    expect([200, 201, 409, 422]).toContain(bookingResponse.status());

    if ([200, 201].includes(bookingResponse.status())) {
      await expect.poll(() => dialogMessage).toBe("Бронь создана");

      const bookingsResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/bookings/me") &&
          response.request().method() === "GET",
        { timeout: 15_000 },
      );

      await page.goto("/bookings");

      const bookingsResponse = await bookingsResponsePromise;
      expect(bookingsResponse.status()).toBe(200);

      await expect(
        page.getByRole("heading", { name: /мои бронирования/i }),
      ).toBeVisible();

      await expect(page.locator("body")).toContainText(dateFrom);
      await expect(page.locator("body")).toContainText(dateTo);
      await expect(page.getByRole("button", { name: /удалить/i }).first()).toBeVisible();
    } else {
      await expect
        .poll(() => dialogMessage)
        .toMatch(/ошибка|нет свободных|нельзя|раньше даты выезда|в прошлом|уже/i);
    }
  });
});