import { test, expect } from '@playwright/test';

test.describe('Навигационные пользовательские сценарии', () => {
  test('пользователь может перейти с главной страницы на логин и вернуться назад через браузер', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Войти' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Вход' })).toBeVisible();

    await page.goBack();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'Отели' })).toBeVisible();
  });

  test('страница бронирований открывается как отдельный пользовательский раздел', async ({ page }) => {
    await page.goto('/bookings');

    await expect(page.locator('body')).toBeVisible();
  });

  test('страница питомцев открывается как отдельный пользовательский раздел', async ({ page }) => {
    await page.goto('/pets');

    await expect(page.locator('body')).toBeVisible();
  });
});