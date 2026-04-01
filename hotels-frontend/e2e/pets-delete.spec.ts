import { test, expect, Page, APIRequestContext } from "@playwright/test";

function uniqueEmail(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}@example.com`;
}

function uniquePetName(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

async function registerViaApi(
  request: APIRequestContext,
  email: string,
  password: string,
) {
  const response = await request.post("http://127.0.0.1:8000/auth/register", {
    data: { email, password },
  });

  expect(response.ok()).toBeTruthy();
}

async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto("/login");

  await page.getByPlaceholder("Введите email").fill(email);
  await page.getByPlaceholder("Введите пароль").fill(password);

  const loginResponsePromise = page.waitForResponse((response) => {
    return (
      response.url().includes("/auth/login") &&
      response.request().method() === "POST"
    );
  });

  await page.getByRole("button", { name: /^Войти$/i }).click();

  const loginResponse = await loginResponsePromise;
  expect(loginResponse.status()).toBe(200);

  await expect(page.getByRole("heading", { name: /отели/i })).toBeVisible();
}

test.describe("удаление питомца", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("пользователь удаляет питомца через UI, backend удаляет запись из БД, и UI обновляется", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("pet_delete");
    const password = "secret123";
    const petName = uniquePetName("ТестПитомец");

    await registerViaApi(request, email, password);
    await loginViaUi(page, email, password);

    const initialPetsResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes("/pets/me") &&
        response.request().method() === "GET"
      );
    });

    await page.goto("/pets");

    const initialPetsResponse = await initialPetsResponsePromise;
    expect(initialPetsResponse.status()).toBe(200);

    await expect(
      page.getByRole("heading", { name: /мои питомцы/i }),
    ).toBeVisible();

    await page.getByPlaceholder("Имя питомца").fill(petName);

    const selects = page.locator("select");
    await selects.nth(0).selectOption("cat");
    await selects.nth(1).selectOption("false");
    await selects.nth(2).selectOption("true");

    const createPetResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes("/pets") &&
        response.request().method() === "POST"
      );
    });

    await page.getByRole("button", { name: /добавить питомца/i }).click();

    const createPetResponse = await createPetResponsePromise;
    expect(createPetResponse.status()).toBe(200);

    await expect(page.locator("body")).toContainText(petName);

    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toMatch(/удалить питомца/i);
      await dialog.accept();
    });

    const deleteResponsePromise = page.waitForResponse((response) => {
      return (
        /\/pets\/\d+/.test(response.url()) &&
        response.request().method() === "DELETE"
      );
    });

    const reloadAfterDeletePromise = page.waitForResponse((response) => {
      return (
        response.url().includes("/pets/me") &&
        response.request().method() === "GET"
      );
    });

    await page.getByRole("button", { name: /^Удалить$/i }).first().click();

    const deleteResponse = await deleteResponsePromise;
    expect(deleteResponse.status()).toBe(200);

    const reloadAfterDelete = await reloadAfterDeletePromise;
    expect(reloadAfterDelete.status()).toBe(200);

    await expect(page.locator("body")).not.toContainText(petName);
  });
});