import { test, expect } from '@playwright/test';

test.describe('Главная страница отелей', () => {
  test('главная страница открывается', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Отели' })).toBeVisible();
  });

  test('на странице есть поиск по городу и названию', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByPlaceholder(/город|location/i)
    ).toBeVisible();

    await expect(
      page.getByPlaceholder(/название отеля|название/i)
    ).toBeVisible();
  });

  test('на странице есть фильтр по требованиям питомца', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: /Фильтр по требованиям питомца/i })
  ).toBeVisible();
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

    await expect(page.getByPlaceholder('Темп. мин')).toHaveValue('');
    await expect(page.getByPlaceholder('Темп. макс')).toHaveValue('');

    if (await vaccinationsInput.count()) {
      await expect(vaccinationsInput).toHaveValue('');
    }
  });

  test('кнопка Войти переводит на страницу логина', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Войти' }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('кнопка Мои бронирования открывает страницу бронирований', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /Мои бронирования/i }).click();
    await expect(page).toHaveURL(/\/bookings/);
  });
});