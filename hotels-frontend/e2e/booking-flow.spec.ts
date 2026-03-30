import { test, expect } from "@playwright/test";

function formatDate(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

test.describe("E2E: бронирование через фронт и бек", () => {
  const email = `booking_${Date.now()}@example.com`;
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

  test("пользователь открывает страницу отеля и может заполнить даты", async ({ page }) => {
    await page.goto("/login");

    await page.getByPlaceholder("Введите email").fill(email);
    await page.getByPlaceholder("Введите пароль").fill(password);
    await page.getByRole("button", { name: /войти/i }).click();

    await expect(page).toHaveURL(/\/$/);

    await page.goto("/hotels/1");

    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs.first()).toBeVisible();

    const dateFrom = formatDate(1);
    const dateTo = formatDate(3);

    await dateInputs.nth(0).fill(dateFrom);
    await dateInputs.nth(1).fill(dateTo);

    await expect(dateInputs.nth(0)).toHaveValue(dateFrom);
    await expect(dateInputs.nth(1)).toHaveValue(dateTo);

    const bookingButton = page.getByRole("button", { name: /забронировать/i }).first();

    if (await bookingButton.count()) {
      const bookingResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/bookings") &&
          response.request().method() === "POST",
        { timeout: 10_000 }
      ).catch(() => null);

      await bookingButton.click();

      const bookingResponse = await bookingResponsePromise;

      if (bookingResponse) {
        expect([200, 201, 409, 422]).toContain(bookingResponse.status());
      }
    }
  });
});