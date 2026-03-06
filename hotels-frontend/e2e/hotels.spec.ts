import { test, expect } from '@playwright/test';

test.describe('Главная страница отелей', () => {
  test('главная страница открывается', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Отели' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Войти' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Мои бронирования' })).toBeVisible();
  });

  test('на странице есть поиск по городу и названию', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByPlaceholder('Город (Moscow, MOW...)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Найти по городу' })).toBeVisible();
    await expect(page.getByPlaceholder('Название отеля')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Найти по названию' })).toBeVisible();
  });

  test('на странице есть фильтр по требованиям питомца', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Фильтр по требованиям питомца' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Очистить фильтр' })).toBeVisible();
    await expect(page.getByPlaceholder('Темп. мин')).toBeVisible();
    await expect(page.getByPlaceholder('Темп. макс')).toBeVisible();
    await expect(page.getByPlaceholder('Влажн. мин')).toBeVisible();
    await expect(page.getByPlaceholder('Влажн. макс')).toBeVisible();
  });

  test('можно заполнить фильтры на главной странице', async ({ page }) => {
    await page.goto('/');

    await page.getByPlaceholder('Город (Moscow, MOW...)').fill('Moscow');
    await page.getByPlaceholder('Название отеля').fill('Test Hotel');
    await page.getByPlaceholder('Темп. мин').fill('20');
    await page.getByPlaceholder('Темп. макс').fill('28');
    await page.getByPlaceholder('Влажн. мин').fill('40');
    await page.getByPlaceholder('Влажн. макс').fill('60');
    await page.getByPlaceholder('Прививки (через запятую)').fill('rabies, complex');
    await page.getByPlaceholder('Диета (тип)').fill('natural');
    await page.getByPlaceholder('Особенности питания').fill('no sugar');
    await page.getByPlaceholder('Кормлений/день').fill('3');

    await expect(page.getByPlaceholder('Город (Moscow, MOW...)')).toHaveValue('Moscow');
    await expect(page.getByPlaceholder('Название отеля')).toHaveValue('Test Hotel');
    await expect(page.getByPlaceholder('Темп. мин')).toHaveValue('20');
    await expect(page.getByPlaceholder('Темп. макс')).toHaveValue('28');
    await expect(page.getByPlaceholder('Влажн. мин')).toHaveValue('40');
    await expect(page.getByPlaceholder('Влажн. макс')).toHaveValue('60');
  });

  test('кнопка очистки фильтра сбрасывает поля', async ({ page }) => {
    await page.goto('/');

    await page.getByPlaceholder('Темп. мин').fill('20');
    await page.getByPlaceholder('Темп. макс').fill('28');
    await page.getByPlaceholder('Прививки (через запятую)').fill('rabies');

    await page.getByRole('button', { name: 'Очистить фильтр' }).click();

    await expect(page.getByPlaceholder('Темп. мин')).toHaveValue('');
    await expect(page.getByPlaceholder('Темп. макс')).toHaveValue('');
    await expect(page.getByPlaceholder('Прививки (через запятую)')).toHaveValue('');
  });

  test('кнопка Войти переводит на страницу логина', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Войти' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Вход' })).toBeVisible();
  });

  test('кнопка Мои бронирования открывает страницу бронирований', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Мои бронирования' }).click();

    await expect(page).toHaveURL(/\/bookings$/);
  });
});