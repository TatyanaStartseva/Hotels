import { test, expect } from '@playwright/test';

test.describe('Страница конкретного отеля', () => {
  test('страница конкретного отеля открывается', async ({ page }) => {
    await page.goto('/hotels/1');

    await expect(page.getByRole('heading', { name: 'Отель #1' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Комнаты' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Отзывы' })).toBeVisible();
  });

  test('на странице есть поля выбора дат', async ({ page }) => {
    await page.goto('/hotels/1');

    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs.nth(0)).toBeVisible();
    await expect(dateInputs.nth(1)).toBeVisible();
  });

  test('можно заполнить даты заезда и выезда', async ({ page }) => {
    await page.goto('/hotels/1');

    const dateInputs = page.locator('input[type="date"]');
    await dateInputs.nth(0).fill('2030-05-10');
    await dateInputs.nth(1).fill('2030-05-15');

    await expect(dateInputs.nth(0)).toHaveValue('2030-05-10');
    await expect(dateInputs.nth(1)).toHaveValue('2030-05-15');
  });

  test('на странице есть блок отзывов', async ({ page }) => {
    await page.goto('/hotels/1');

    await expect(page.getByRole('heading', { name: 'Отзывы' })).toBeVisible();
    await expect(page.getByText('Оставить отзыв')).toBeVisible();
  });

  test('если нет бронирований, показывается сообщение о невозможности оставить отзыв', async ({ page }) => {
    await page.goto('/hotels/1');

    await expect(
      page.getByText('У тебя нет бронирований для этого отеля — отзыв оставить нельзя.')
    ).toBeVisible();
  });
});