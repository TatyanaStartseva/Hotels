import { test, expect } from "@playwright/test";

function formatDate(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

test.describe("сценарий бронирования", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.setItem("token", "e2e-token");
      sessionStorage.clear();
    });
  });

  test("пользователь бронирует номер со страницы отеля и видит бронь на странице своих бронирований", async ({ page }) => {
    const dateFrom = formatDate(1);
    const dateTo = formatDate(3);
    let bookings: any[] = [];

    await page.route("**/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: 1, email: "user@example.com", is_admin: false }),
      });
    });

    await page.route("**/rooms/1/rooms**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: 10,
            hotel_id: 1,
            title: "Стандартный номер",
            description: "Уютный номер",
            price: 3000,
            quantity: 2,
            available: 1,
          },
        ]),
      });
    });

    await page.route("**/bookings/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(bookings),
      });
    });

    await page.route("**/bookings", async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }

      const body = route.request().postDataJSON() as any;
      bookings = [
        {
          id: 1,
          room_id: body.room_id,
          hotel_title: "Отель",
          pet_name: "Не указано",
          date_from: body.date_from,
          date_to: body.date_to,
          status: "confirmed",
        },
      ];

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(bookings[0]),
      });
    });

    await page.goto("/hotels/1");
    await expect(page.getByRole("heading", { name: /отель/i })).toBeVisible();
    await expect(page.getByText(/даты бронирования/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Комнаты$/i })).toBeVisible();

    const dateInputs = page.locator('input[type="date"]');
    await dateInputs.nth(0).fill(dateFrom);
    await dateInputs.nth(1).fill(dateTo);

    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toMatch(/бронь создана/i);
      await dialog.accept();
    });

    await page.getByRole("button", { name: /забронировать/i }).first().click();
    await page.getByRole("button", { name: /мои бронирования/i }).click();

    await expect(page.getByRole("heading", { name: /мои бронирования/i })).toBeVisible();
    await expect(page.locator("body")).toContainText("Отель");
    await expect(page.locator("body")).toContainText(dateFrom);
    await expect(page.locator("body")).toContainText(dateTo);
  });
});
