import { test, expect } from '@playwright/test';

test('страница входа отображает форму авторизации', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByPlaceholder('Введите email')).toBeVisible();
  await expect(page.getByPlaceholder('Введите пароль')).toBeVisible();
  await expect(page.getByRole('button', { name: /войти/i })).toBeVisible();
});

test('кнопка "К отелям" возвращает пользователя на главную страницу', async ({ page }) => {
  await page.goto('/login');

  await page.getByRole('button', { name: 'К отелям' }).click();

  await expect.poll(async () => page.url()).toMatch(/(\/$|\/hotels$)/);
});

test('форма входа принимает ввод email и пароля', async ({ page }) => {
  await page.goto('/login');

  await page.getByPlaceholder('Введите email').fill('test@example.com');
  await page.getByPlaceholder('Введите пароль').fill('123456');

  await expect(page.getByPlaceholder('Введите email')).toHaveValue('test@example.com');
  await expect(page.getByPlaceholder('Введите пароль')).toHaveValue('123456');
});