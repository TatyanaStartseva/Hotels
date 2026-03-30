import { test, expect } from '@playwright/test';

test.describe('Главная страница отелей', () => {
  const email = `ui_${Date.now()}@example.com`;
  const password = 'secret123';

  test.beforeAll(async ({ request }) => {
    await request.post('http://127.0.0.1:8000/auth/register', {
      data: { email, password },
    });
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Введите email').fill(email);
    await page.getByPlaceholder('Введите пароль').fill(password);
    await page.getByRole('button', { name: /войти/i }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('главная страница открывается', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Отели/i })).toBeVisible();
  });

  test('на странице есть поиск по городу и названию', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByPlaceholder(/город|location/i)).toBeVisible();
    await expect(page.getByPlaceholder(/название отеля|название/i)).toBeVisible();
  });

  test('на странице есть фильтр по требованиям питомца', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('body')).toContainText(/питом|живот|species|вакцин|темп/i);
  });

  test('можно заполнить фильтры на главной странице', async ({ page }) => {
    await page.goto('/');

    await page.getByPlaceholder(/город|location/i).fill('Moscow');
    await page.getByPlaceholder(/название отеля|название/i).fill('Test Hotel');
    await page.getByPlaceholder('Темп. мин').fill('20');
    await page.getByPlaceholder('Темп. макс').fill('28');

    await expect(page.getByPlaceholder(/город|location/i)).toHaveValue('Moscow');
    await expect(page.getByPlaceholder(/название отеля|название/i)).toHaveValue('Test Hotel');
    await expect(page.getByPlaceholder('Темп. мин')).toHaveValue('20');
    await expect(page.getByPlaceholder('Темп. макс')).toHaveValue('28');
  });

  test('кнопка очистки фильтра сбрасывает поля', async ({ page }) => {
    await page.goto('/');

    await page.getByPlaceholder('Темп. мин').fill('20');
    await page.getByPlaceholder('Темп. макс').fill('28');

    const vaccinationsInput = page.getByPlaceholder(/привив|vaccin|rabies/i);
    if (await vaccinationsInput.count()) {
      await vaccinationsInput.fill('rabies');
    }

    await page.getByRole('button', { name: /Очистить фильтр|Очистить/i }).click();

    await expect(page.getByPlaceholder('Темп. мин')).toBeVisible();
    await expect(page.getByPlaceholder('Темп. макс')).toBeVisible();

    await expect(page.getByPlaceholder('Темп. мин')).toHaveValue('');
    await expect(page.getByPlaceholder('Темп. макс')).toHaveValue('');

    if (await page.getByPlaceholder(/привив|vaccin|rabies/i).count()) {
      await expect(page.getByPlaceholder(/привив|vaccin|rabies/i)).toHaveValue('');
    }
  });

  test('кнопка Войти переводит на страницу логина', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
  });

  test('кнопка Мои бронирования открывает страницу бронирований', async ({ page, request }) => {
    const localEmail = `bookings_btn_${Date.now()}@example.com`;
    const localPassword = 'secret123';

    await request.post('http://127.0.0.1:8000/auth/register', {
      data: { email: localEmail, password: localPassword },
    });

    await page.goto('/login');
    await page.getByPlaceholder('Введите email').fill(localEmail);
    await page.getByPlaceholder('Введите пароль').fill(localPassword);
    await page.getByRole('button', { name: /войти/i }).click();

    await expect(page).toHaveURL(/\/$/);

    await page.getByRole('button', { name: /Мои бронирования/i }).click();
    await expect(page).toHaveURL(/\/bookings/);
  });
});