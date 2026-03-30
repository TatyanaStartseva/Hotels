import { test, expect } from '@playwright/test';

test('страница логина открывается и содержит нужные элементы', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByRole('heading', { name: 'Вход' })).toBeVisible();
  await expect(page.getByPlaceholder('Введите email')).toBeVisible();
  await expect(page.getByPlaceholder('Введите пароль')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Войти' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'К отелям' })).toBeVisible();
});

test('кнопка "К отелям" возвращает на страницу отелей', async ({ page }) => {
  await page.goto('/login');

  await page.getByRole('button', { name: 'К отелям' }).click();

  await expect(page).toHaveURL(/\/hotels/);
});

test('на странице входа можно заполнить форму', async ({ page }) => {
  await page.goto('/login');

  await page.getByPlaceholder('Введите email').fill('new@example.com');
  await page.getByPlaceholder('Введите пароль').fill('secret123');

  await expect(page.getByPlaceholder('Введите email')).toHaveValue('new@example.com');
  await expect(page.getByPlaceholder('Введите пароль')).toHaveValue('secret123');
});