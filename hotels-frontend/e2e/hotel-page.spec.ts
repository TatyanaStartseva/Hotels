import { test, expect } from '@playwright/test';

test.describe('Страница конкретного отеля', () => {
  test('страница конкретного отеля открывается', async ({ page }) => {
    await page.goto('/hotels/1');

    await expect(page.getByRole('heading', { name: /Отель/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Комнаты' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Отзывы' })).toBeVisible();
  });

  test('на странице есть поля выбора дат', async ({ page }) => {
    await page.goto('/hotels/1');

    await expect(page.locator('input[type="date"]').nth(0)).toBeVisible();
    await expect(page.locator('input[type="date"]').nth(1)).toBeVisible();
  });

  test('можно заполнить даты заезда и выезда', async ({ page }) => {
    await page.goto('/hotels/1');

    const dateFrom = page.locator('input[type="date"]').nth(0);
    const dateTo = page.locator('input[type="date"]').nth(1);

    await dateFrom.fill('2026-04-10');
    await dateTo.fill('2026-04-15');

    await expect(dateFrom).toHaveValue('2026-04-10');
    await expect(dateTo).toHaveValue('2026-04-15');
  });

  test('на странице есть блок отзывов', async ({ page }) => {
    await page.goto('/hotels/1');

    await expect(page.getByRole('heading', { name: 'Отзывы' })).toBeVisible();
  });

  test('если нет бронирований, показывается сообщение о невозможности оставить отзыв', async ({ page }) => {
    await page.goto('/hotels/1');

    await expect(
      page.getByText(/нет бронирований|отзыв оставить нельзя/i)
    ).toBeVisible();
  });
});