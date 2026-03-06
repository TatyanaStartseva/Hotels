import { test, expect } from '@playwright/test';

test('страница логина открывается и содержит нужные элементы', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByRole('heading', { name: 'Вход' })).toBeVisible();
  await expect(page.getByPlaceholder('Email')).toBeVisible();
  await expect(page.getByPlaceholder('Пароль')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Войти' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Перейти к регистрации' })).toBeVisible();
});

test('можно переключиться в режим регистрации', async ({ page }) => {
  await page.goto('/login');

  await page.getByRole('button', { name: 'Перейти к регистрации' }).click();

  await expect(page.getByRole('heading', { name: 'Регистрация' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Зарегистрироваться' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Перейти ко входу' })).toBeVisible();
});

test('в режиме регистрации можно заполнить форму', async ({ page }) => {
  await page.goto('/login');

  await page.getByRole('button', { name: 'Перейти к регистрации' }).click();

  await page.getByPlaceholder('Email').fill('new@example.com');
  await page.getByPlaceholder('Пароль').fill('secret123');

  await expect(page.getByPlaceholder('Email')).toHaveValue('new@example.com');
  await expect(page.getByPlaceholder('Пароль')).toHaveValue('secret123');
});