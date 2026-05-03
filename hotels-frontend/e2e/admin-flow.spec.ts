import { test, expect, type Page, type APIResponse } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

const API_URL = "http://127.0.0.1:8000";

test.describe.configure({ mode: "serial" });

function unique(prefix: string) {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

function createAdminUser() {
  const output = execFileSync(
    "python",
    ["e2e/db_seed.py", "create_admin_user"],
    {
      cwd: process.cwd(),
      encoding: "utf-8",
    }
  );

  return JSON.parse(output.trim()) as {
    email: string;
    password: string;
  };
}

async function getToken(page: Page) {
  return page.evaluate(() => window.localStorage.getItem("token"));
}

async function apiGet(page: Page, path: string): Promise<APIResponse> {
  const token = await getToken(page);

  return page.request.get(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto("/login");

  await page.getByPlaceholder("Введите email").fill(email);
  await page.getByPlaceholder("Введите пароль").fill(password);

  const loginResponsePromise = page.waitForResponse(
    (res) =>
      res.url().includes("/auth/login") &&
      res.request().method() === "POST"
  );

  await page.getByRole("button", { name: /^войти$/i }).click();

  const loginResponse = await loginResponsePromise;
  const bodyText = await loginResponse.text();

  expect(
    loginResponse.status(),
    `Логин не прошёл. Status=${loginResponse.status()}, body=${bodyText}`
  ).toBeLessThan(300);

  const token = await getToken(page);
  expect(token).toBeTruthy();
}

test.beforeEach(async ({ page }) => {
  await page.context().clearCookies();
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
});

test(" Администратор входит в систему и видит раздел управления рекламой", async ({ page }) => {
  const admin = createAdminUser();

  await loginViaUi(page, admin.email, admin.password);

  const meResponse = await apiGet(page, "/auth/me");
  expect(meResponse.status()).toBe(200);

  const me = await meResponse.json();
  expect(me.email).toBe(admin.email);
  expect(me.is_admin).toBeTruthy();

  await page.goto("/");

  await expect(page.locator("body")).toContainText(/управление рекламой/i);

  await page.getByRole("button", { name: /управление рекламой/i }).click();

  await expect(page).toHaveURL(/\/admin\/ads/);
  await expect(page.getByRole("heading", { name: /управление рекламой/i })).toBeVisible();
});

test(" Администратор создаёт рекламу: UI отправляет POST, backend сохраняет запись, список обновляется", async ({ page }) => {
  const admin = createAdminUser();

  const adTitle = unique("E2E Реклама");
  const adDescription = "Тестовое объявление, созданное администратором";
  const imageUrl = "https://example.com/e2e-ad.png";
  const targetUrl = "https://example.com";

  await loginViaUi(page, admin.email, admin.password);

  await page.goto("/admin/ads");

  await expect(page.getByRole("heading", { name: /управление рекламой/i })).toBeVisible();

  await page.getByPlaceholder(/например: скидка/i).fill(adTitle);
  await page.locator("select").selectOption("premium");
  await page.getByPlaceholder(/краткое описание/i).fill(adDescription);

  const urlInputs = page.locator('input[placeholder="https://..."]');
  await urlInputs.nth(0).fill(imageUrl);
  await urlInputs.nth(1).fill(targetUrl);

  const createResponsePromise = page.waitForResponse(
    (res) =>
      res.url().endsWith("/ads") &&
      res.request().method() === "POST"
  );

  await page.getByRole("button", { name: /^добавить рекламу$/i }).click();

  const createResponse = await createResponsePromise;
  const createBody = await createResponse.text();

  expect(
    createResponse.status(),
    `Реклама не создалась. Status=${createResponse.status()}, body=${createBody}`
  ).toBeLessThan(300);

  const createdAd = JSON.parse(createBody);

  expect(createdAd.title).toBe(adTitle);
  expect(createdAd.description).toBe(adDescription);
  expect(createdAd.plan_name).toBe("premium");
  expect(createdAd.weight).toBe(3);

  await expect(page.locator("body")).toContainText(adTitle);
  await expect(page.locator("body")).toContainText(adDescription);
  await expect(page.locator("body")).toContainText(/тариф: premium/i);
  await expect(page.locator("body")).toContainText(/вес: 3/i);

  const adsResponse = await apiGet(page, "/ads");
  expect(adsResponse.status()).toBe(200);

  const ads = await adsResponse.json();

  expect(
    ads.some((ad: any) => ad.id === createdAd.id && ad.title === adTitle)
  ).toBeTruthy();
});

test(" Администратор редактирует рекламу: PATCH меняет данные в backend и frontend показывает новые значения", async ({ page }) => {
  const admin = createAdminUser();

  const adTitle = unique("E2E Edit Ad");
  const updatedTitle = unique("E2E Edited Ad");
  const updatedDescription = "Описание после редактирования";

  await loginViaUi(page, admin.email, admin.password);

  await page.goto("/admin/ads");

  await page.getByPlaceholder(/например: скидка/i).fill(adTitle);
  await page.locator("select").selectOption("basic");
  await page.getByPlaceholder(/краткое описание/i).fill("Первичное описание");

  const createResponsePromise = page.waitForResponse(
    (res) =>
      res.url().endsWith("/ads") &&
      res.request().method() === "POST"
  );

  await page.getByRole("button", { name: /^добавить рекламу$/i }).click();

  const createResponse = await createResponsePromise;
  expect(createResponse.status()).toBeLessThan(300);

  const createdAd = await createResponse.json();

  await expect(page.locator("body")).toContainText(adTitle);

  const adCard = page.locator(".admin-ads-item", { hasText: adTitle });

  await adCard.getByRole("button", { name: /редактировать/i }).click();

  await expect(page.getByRole("heading", { name: /редактировать рекламу/i })).toBeVisible();

  await page.getByPlaceholder(/например: скидка/i).fill(updatedTitle);
  await page.getByPlaceholder(/краткое описание/i).fill(updatedDescription);
  await page.locator("select").selectOption("vip");

  const patchResponsePromise = page.waitForResponse(
    (res) =>
      res.url().includes(`/ads/${createdAd.id}`) &&
      res.request().method() === "PATCH"
  );

  await page.getByRole("button", { name: /^сохранить изменения$/i }).click();

  const patchResponse = await patchResponsePromise;
  const patchBody = await patchResponse.text();

  expect(
    patchResponse.status(),
    `Реклама не обновилась. Status=${patchResponse.status()}, body=${patchBody}`
  ).toBeLessThan(300);

  const updatedAd = JSON.parse(patchBody);

    expect(updatedAd.title).toBe(updatedTitle);
  expect(updatedAd.description).toBe(updatedDescription);
  expect(updatedAd.plan_name).toBe("vip");
  expect(updatedAd.weight).toBe(8);

  await page.reload();

  await expect(page.locator("body")).toContainText(updatedTitle);
  await expect(page.locator("body")).toContainText(updatedDescription);
  await expect(page.locator("body")).toContainText(/тариф: vip/i);
  await expect(page.locator("body")).toContainText(/вес: 8/i);
});

test("Администратор удаляет рекламу: DELETE удаляет запись из backend и она исчезает из интерфейса", async ({ page }) => {
  const admin = createAdminUser();

  const adTitle = unique("E2E Delete Ad");

  await loginViaUi(page, admin.email, admin.password);

  await page.goto("/admin/ads");

  await page.getByPlaceholder(/например: скидка/i).fill(adTitle);
  await page.getByPlaceholder(/краткое описание/i).fill("Объявление для удаления");

  const createResponsePromise = page.waitForResponse(
    (res) =>
      res.url().endsWith("/ads") &&
      res.request().method() === "POST"
  );

  await page.getByRole("button", { name: /^добавить рекламу$/i }).click();

  const createResponse = await createResponsePromise;
  expect(createResponse.status()).toBeLessThan(300);

  const createdAd = await createResponse.json();

  await expect(page.locator("body")).toContainText(adTitle);

  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toMatch(/удалить рекламу/i);
    await dialog.accept();
  });

  const deleteResponsePromise = page.waitForResponse(
    (res) =>
      res.url().includes(`/ads/${createdAd.id}`) &&
      res.request().method() === "DELETE"
  );

  const adCard = page.locator(".admin-ads-item", { hasText: adTitle });
  await adCard.getByRole("button", { name: /удалить/i }).click();

  const deleteResponse = await deleteResponsePromise;
  const deleteBody = await deleteResponse.text();

  expect(
    deleteResponse.status(),
    `Реклама не удалилась. Status=${deleteResponse.status()}, body=${deleteBody}`
  ).toBeLessThan(300);

  await expect(page.locator("body")).not.toContainText(adTitle);

  const adsResponse = await apiGet(page, "/ads");
  expect(adsResponse.status()).toBe(200);

  const ads = await adsResponse.json();

  expect(
    ads.some((ad: any) => ad.id === createdAd.id)
  ).toBeFalsy();
});