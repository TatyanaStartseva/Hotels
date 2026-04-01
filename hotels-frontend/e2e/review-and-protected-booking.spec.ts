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
}

async function findBookableHotelId(
  request: APIRequestContext,
  dateFrom: string,
  dateTo: string,
): Promise<number> {
  const hotelsResponse = await request.get("http://127.0.0.1:8000/hotels");
  expect(hotelsResponse.ok()).toBeTruthy();

  const hotels = await hotelsResponse.json();
  expect(Array.isArray(hotels)).toBeTruthy();
  expect(hotels.length).toBeGreaterThan(0);

  for (const hotel of hotels) {
    const roomsResponse = await request.get(
      `http://127.0.0.1:8000/rooms/${hotel.id}/rooms?date_from=${dateFrom}&date_to=${dateTo}`,
    );

    if (!roomsResponse.ok()) continue;

    const rooms = await roomsResponse.json();
    if (!Array.isArray(rooms) || rooms.length === 0) continue;

    return hotel.id;
  }

  throw new Error("Не найден ни один отель с доступной комнатой для бронирования");
}

test.describe("E2E: отзыв и защита удаления брони", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("пользователь оставляет отзыв по своей брони, после чего удаление этой брони блокируется и UI показывает ошибку", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("review_flow");
    const password = "secret123";
    const dateFrom = formatDate(1);
    const dateTo = formatDate(3);
    const reviewText = `Очень хороший отель ${Date.now()}`;

    await registerViaApi(request, email, password);
    await loginViaUi(page, email, password);

    const hotelId = await findBookableHotelId(request, dateFrom, dateTo);

    await page.goto(`/hotels/${hotelId}`);

    await expect(page.getByRole("heading", { name: /отель/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Комнаты$/i })).toBeVisible();

    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs).toHaveCount(2);

    await dateInputs.nth(0).fill(dateFrom);
    await dateInputs.nth(1).fill(dateTo);

    const bookingButton = page.getByRole("button", { name: /забронировать/i }).first();
    await expect(bookingButton).toBeVisible();
    await expect(bookingButton).toBeEnabled();

    let bookingDialogMessage = "";
    page.once("dialog", async (dialog) => {
      bookingDialogMessage = dialog.message();
      await dialog.accept();
    });

    const bookingResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes("/bookings") &&
        response.request().method() === "POST"
      );
    });

    await bookingButton.click();

    const bookingResponse = await bookingResponsePromise;
    expect([200, 201]).toContain(bookingResponse.status());

    await expect.poll(() => bookingDialogMessage).toBe("Бронь создана");

    await expect(page.getByRole("heading", { name: /отзывы/i })).toBeVisible();

    const bookingSelect = page.locator("select.hotel-input").nth(0);
    await bookingSelect.selectOption({ index: 1 });

    const ratingSelect = page.locator("select.hotel-input").nth(1);
    await ratingSelect.selectOption("5");

    await page.getByPlaceholder("Текст отзыва...").fill(reviewText);

    let reviewDialogMessage = "";
    page.once("dialog", async (dialog) => {
      reviewDialogMessage = dialog.message();
      await dialog.accept();
    });

    const reviewResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes("/reviews") &&
        response.request().method() === "POST"
      );
    });

    await page.getByRole("button", { name: /отправить отзыв/i }).click();

    const reviewResponse = await reviewResponsePromise;
    expect([200, 201]).toContain(reviewResponse.status());

    await expect.poll(() => reviewDialogMessage).toMatch(/отзыв/i);
    await expect(page.locator("body")).toContainText(reviewText);

    const bookingsPageResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes("/bookings/me") &&
        response.request().method() === "GET"
      );
    });

    await page.goto("/bookings");

    const bookingsPageResponse = await bookingsPageResponsePromise;
    expect(bookingsPageResponse.status()).toBe(200);

    await expect(
      page.getByRole("heading", { name: /мои бронирования/i }),
    ).toBeVisible();

    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });

    const deleteResponsePromise = page.waitForResponse((response) => {
      return (
        /\/bookings\/\d+/.test(response.url()) &&
        response.request().method() === "DELETE"
      );
    });

    await page.getByRole("button", { name: /удалить/i }).first().click();

    const deleteResponse = await deleteResponsePromise;
    expect(deleteResponse.status()).toBe(409);

    await expect(page.locator("body")).toContainText(dateFrom);
    await expect(page.locator("body")).toContainText(dateTo);
  });
});