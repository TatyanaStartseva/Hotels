import { test, expect } from '@playwright/test';

test('страница логина открывается и содержит нужные элементы', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByPlaceholder('Введите email')).toBeVisible();
  await expect(page.getByPlaceholder('Введите пароль')).toBeVisible();
  await expect(page.getByRole('button', { name: /войти/i })).toBeVisible();
});

test('кнопка "К отелям" возвращает на страницу отелей', async ({ page }) => {
  await page.goto('/login');

  await page.getByRole('button', { name: 'К отелям' }).click();

  await expect.poll(async () => page.url()).toMatch(/(\/$|\/hotels$)/);
});

test('на странице входа можно заполнить форму', async ({ page }) => {
  await page.goto('/login');

  await page.getByPlaceholder('Введите email').fill('test@example.com');
  await page.getByPlaceholder('Введите пароль').fill('123456');

  await expect(page.getByPlaceholder('Введите email')).toHaveValue('test@example.com');
  await expect(page.getByPlaceholder('Введите пароль')).toHaveValue('123456');
});