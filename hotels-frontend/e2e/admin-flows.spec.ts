import { test, expect, Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

function uniqueEmail(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}@example.com`;
}

function uniqueHotelTitle(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

function uniqueRoomTitle(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function getAdminCredentials() {
  return {
    email: process.env.E2E_ADMIN_EMAIL ?? "admin@example.com",
    password: process.env.E2E_ADMIN_PASSWORD ?? "admin",
  };
}

async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: /вход/i })).toBeVisible();

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

async function loginAsAdmin(page: Page) {
  const admin = getAdminCredentials();
  await loginViaUi(page, admin.email, admin.password);
}

async function adminOpenHotelsPage(page: Page) {
  await page.goto("/");
  await expect(page.locator("body")).toContainText(/добавить отель/i);
}

async function adminCreateHotel(page: Page, title: string, city = "Москва") {
  await page.getByPlaceholder("Название", { exact: true }).fill(title);
  await page.getByPlaceholder("Город", { exact: true }).fill(city);

  const createHotelResponsePromise = page.waitForResponse((response) => {
    return (
      response.url().includes("/hotels") &&
      response.request().method() === "POST"
    );
  });

  await page.getByRole("button", { name: /^Добавить$/i }).click();

  const createHotelResponse = await createHotelResponsePromise;
  expect([200, 201]).toContain(createHotelResponse.status());
}

async function searchHotelByTitle(page: Page, title: string) {
  const titleSearchInput = page.getByPlaceholder("Название отеля", { exact: true });
  await titleSearchInput.fill(title);

  const searchResponsePromise = page.waitForResponse((response) => {
    return (
      response.url().includes("/hotels") &&
      response.request().method() === "GET"
    );
  });

  await page.getByRole("button", { name: /найти по названию/i }).click();

  const searchResponse = await searchResponsePromise;
  expect(searchResponse.status()).toBe(200);
}

test.describe("E2E: пользовательские сценарии", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("регистрация через UI переводит пользователя обратно к форме входа и показывает успешное сообщение", async ({
    page,
  }) => {
    const email = uniqueEmail("register_ui");
    const password = "secret123";

    await page.goto("/login");

    await expect(page.getByRole("heading", { name: /вход/i })).toBeVisible();
    await page.getByRole("button", { name: /перейти к регистрации/i }).click();

    await expect(page.getByRole("heading", { name: /регистрация/i })).toBeVisible();

    await page.getByPlaceholder("Введите email").fill(email);
    await page.getByPlaceholder("Введите пароль").fill(password);

    const registerResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes("/auth/register") &&
        response.request().method() === "POST"
      );
    });

    await page.getByRole("button", { name: /зарегистрироваться/i }).click();

    const registerResponse = await registerResponsePromise;
    expect(registerResponse.status()).toBe(200);

    await expect(
      page.getByText(/регистрация прошла успешно\. теперь войдите в аккаунт\./i),
    ).toBeVisible();

    await expect(page.getByRole("heading", { name: /вход/i })).toBeVisible();
    await expect(page.getByPlaceholder("Введите email")).toHaveValue(email);
    await expect(page.getByPlaceholder("Введите пароль")).toHaveValue("");
  });

  test("админ добавляет отель через UI, и новый отель отображается в интерфейсе", async ({
    page,
  }) => {
    const admin = getAdminCredentials();
    const hotelTitle = uniqueHotelTitle("Test Hotel");

    await loginViaUi(page, admin.email, admin.password);
    await adminOpenHotelsPage(page);

    await adminCreateHotel(page, hotelTitle, "Москва");

    await page.reload();
    await adminOpenHotelsPage(page);
    await searchHotelByTitle(page, hotelTitle);

    await expect(page.locator("body")).toContainText(hotelTitle);
  });



  test("админ редактирует отель через UI, и backend принимает изменения без ошибки", async ({
    page,
  }) => {
    const admin = getAdminCredentials();
    const originalTitle = uniqueHotelTitle("Editable Hotel");
    const updatedTitle = uniqueHotelTitle("Updated Hotel");

    await loginViaUi(page, admin.email, admin.password);
    await adminOpenHotelsPage(page);

    await adminCreateHotel(page, originalTitle, "Москва");

    await page.reload();
    await adminOpenHotelsPage(page);
    await searchHotelByTitle(page, originalTitle);

    await expect(page.locator("body")).toContainText(originalTitle);

    const editButton = page.getByRole("button", { name: /изменить/i }).first();
    await expect(editButton).toBeVisible();
    await editButton.click();

    const titleInput = page.getByPlaceholder("Название", { exact: true }).last();
    const cityInput = page.getByPlaceholder("Город", { exact: true }).last();

    await titleInput.fill(updatedTitle);
    await cityInput.fill("Москва");

    const updateHotelResponsePromise = page.waitForResponse((response) => {
      return (
        /\/hotels\/\d+/.test(response.url()) &&
        ["PUT", "PATCH"].includes(response.request().method())
      );
    });

    await page.getByRole("button", { name: /сохранить/i }).click();

    const updateHotelResponse = await updateHotelResponsePromise;
    expect(updateHotelResponse.status()).toBe(200);

    await page.reload();
    await adminOpenHotelsPage(page);

    await expect(page.locator("body")).not.toContainText(/ошибка/i);
    await expect(page.locator("body")).toContainText(/добавить отель/i);
  });

  test("админ удаляет отель через UI, и отель исчезает из интерфейса", async ({
    page,
  }) => {
    const admin = getAdminCredentials();
    const hotelTitle = uniqueHotelTitle("Delete Hotel");

    await loginViaUi(page, admin.email, admin.password);
    await adminOpenHotelsPage(page);

    await adminCreateHotel(page, hotelTitle, "Москва");

    await page.reload();
    await adminOpenHotelsPage(page);
    await searchHotelByTitle(page, hotelTitle);

    await expect(page.locator("body")).toContainText(hotelTitle);

    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });

    const deleteHotelResponsePromise = page.waitForResponse((response) => {
      return (
        /\/hotels\/\d+/.test(response.url()) &&
        response.request().method() === "DELETE"
      );
    });

    await page.getByRole("button", { name: /удалить/i }).first().click();

    const deleteHotelResponse = await deleteHotelResponsePromise;
    expect([200, 204]).toContain(deleteHotelResponse.status());

    await page.reload();
    await adminOpenHotelsPage(page);
    await searchHotelByTitle(page, hotelTitle);

    await expect(page.locator("body")).not.toContainText(hotelTitle);
  });
});