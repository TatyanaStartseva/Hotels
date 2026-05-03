import { test, expect, type Page, type APIResponse } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

const API_URL = "http://127.0.0.1:8000";

test.describe.configure({ mode: "serial" });

type SeedData = {
  hotel_id: number;
  room_id: number;
  hotel_title: string;
  room_title: string;
  location: string;
  location_ru: string;
};

function unique(prefix: string) {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function uniqueEmail(prefix = "e2e") {
  const safePrefix = prefix.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return `${safePrefix}_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@test.ru`;
}

function futureDate(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function seedHotelRoom(label: string): SeedData {
  const output = execFileSync(
    "python",
    ["e2e/db_seed.py", "seed_hotel_room", label],
    {
      cwd: process.cwd(),
      encoding: "utf-8",
    }
  );

  return JSON.parse(output.trim()) as SeedData;
}

function fixUsersSequence() {
  execFileSync("python", ["e2e/db_seed.py", "fix_users_sequence"], {
    cwd: process.cwd(),
    encoding: "utf-8",
  });
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

async function apiPost(
  page: Page,
  path: string,
  data: unknown
): Promise<APIResponse> {
  const token = await getToken(page);

  return page.request.post(`${API_URL}${path}`, {
    data,
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
    `Логин не прошёл. Status=${loginResponse.status()}, body=${bodyText}, email=${email}`
  ).toBeLessThan(300);

  const token = await page.evaluate(() => window.localStorage.getItem("token"));

  expect(
    token,
    "После входа frontend должен сохранить access_token в localStorage"
  ).toBeTruthy();

  await page.goto("/");

  await expect(page.locator("body")).not.toContainText(/войти/i);
  await expect(page.locator("body")).toContainText(/отели|гостиницы|поиск/i);
}

async function registerViaUi(
  page: Page,
  prefix = "e2e_user",
  password = "secret123"
) {
  for (let attempt = 1; attempt <= 10; attempt++) {
    const email = uniqueEmail(`${prefix}_${attempt}`);

    await page.goto("/login");
    await page.getByRole("button", { name: /перейти к регистрации/i }).click();

    await page.getByPlaceholder("Введите email").fill(email);
    await page.getByPlaceholder("Введите пароль").fill(password);

    const registerResponsePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/auth/register") &&
        res.request().method() === "POST"
    );

    await page.getByRole("button", { name: /^зарегистрироваться$/i }).click();

    const registerResponse = await registerResponsePromise;
    const bodyText = await registerResponse.text();

    if (registerResponse.status() === 409) {
      continue;
    }

    expect(
      registerResponse.status(),
      `Регистрация не прошла. Email=${email}, Status=${registerResponse.status()}, body=${bodyText}`
    ).toBeLessThan(300);

    await expect(page.getByText(/регистрация прошла успешно/i)).toBeVisible();

    return { email, password };
  }

  throw new Error("Не удалось создать пользователя: все email получили 409");
}

async function createUserAndLogin(page: Page) {
  const { email, password } = await registerViaUi(page);

  await loginViaUi(page, email, password);

  return { email, password };
}

async function createPetViaUi(page: Page, petName: string) {
  await page.goto("/pets");

  await expect(page.getByRole("heading", { name: /мои питомцы/i })).toBeVisible();

  await page.getByPlaceholder("Имя питомца").fill(petName);
  await page.locator("select").nth(0).selectOption("cat");
  await page.getByPlaceholder(/нужен террариум/i).fill("Тихое место, без сквозняков");
  await page.locator('input[type="number"]').nth(0).fill("18");
  await page.locator('input[type="number"]').nth(1).fill("26");
  await page.locator('input[type="number"]').nth(2).fill("35");
  await page.locator('input[type="number"]').nth(3).fill("65");
  await page.getByPlaceholder("Например: сухой корм").fill("dry");
  await page.locator('input[type="number"]').nth(4).fill("2");
  await page.getByPlaceholder(/кормить 2 раза/i).fill("Без молочных продуктов");
  await page.getByPlaceholder(/rabies, complex/i).fill("rabies, complex");
  await page.locator("select").nth(1).selectOption("false");
  await page.locator("select").nth(2).selectOption("true");

  const createResponsePromise = page.waitForResponse(
    (res) => res.url().endsWith("/pets") && res.request().method() === "POST"
  );

  await page.getByRole("button", { name: /добавить питомца/i }).click();

  const createResponse = await createResponsePromise;
  expect(createResponse.status()).toBeLessThan(300);

  await expect(page.locator("body")).toContainText(petName);
}

test.beforeAll(() => {
  fixUsersSequence();
});

test.beforeEach(async ({ page }) => {
  await page.context().clearCookies();

  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
});

test("1. Регистрация нового аккаунта и вход в систему через форму авторизации", async ({ page }) => {
  const { email } = await createUserAndLogin(page);

  const me = await apiGet(page, "/auth/me");
  expect(me.status()).toBe(200);

  const meJson = await me.json();
  expect(meJson.email).toBe(email);
});

test("2. Ввод неправильного пароля показывает ошибку входа", async ({ page }) => {
  const { email, password } = await registerViaUi(page, "bad_password");

  await page.goto("/login");
  await page.getByPlaceholder("Введите email").fill(email);
  await page.getByPlaceholder("Введите пароль").fill(`${password}_wrong`);

  const loginResponsePromise = page.waitForResponse(
    (res) =>
      res.url().includes("/auth/login") &&
      res.request().method() === "POST"
  );

  await page.getByRole("button", { name: /^войти$/i }).click();

  const loginResponse = await loginResponsePromise;
  expect(loginResponse.status()).toBe(401);

  await expect(page.getByText(/пароль неверный|ошибка входа/i)).toBeVisible();
});

test("3. Открытие главной страницы загружает список отелей из базы данных", async ({ page }) => {
  await createUserAndLogin(page);

  const seed = seedHotelRoom(unique("hotels_list"));

  const hotelsResponsePromise = page.waitForResponse(
    (res) =>
      res.url().includes("/hotels") &&
      res.request().method() === "GET"
  );

  await page.goto("/");

  const hotelsResponse = await hotelsResponsePromise;
  expect([200, 304]).toContain(hotelsResponse.status());

  await expect(page.getByRole("heading", { name: /отели/i })).toBeVisible();
  await expect(page.locator("body")).toContainText(/поиск отелей/i);

  const apiResponse = await apiGet(
    page,
    `/hotels?title=${encodeURIComponent(seed.hotel_title)}`
  );

  expect(apiResponse.status()).toBe(200);

  const hotels = await apiResponse.json();
  expect(Array.isArray(hotels)).toBeTruthy();

  expect(
    hotels.some(
      (hotel: any) =>
        hotel.id === seed.hotel_id || hotel.title === seed.hotel_title
    )
  ).toBeTruthy();
});

test("4. Поиск по названию отеля отправляет запрос на backend и показывает найденный результат", async ({ page }) => {
  await createUserAndLogin(page);

  const seed = seedHotelRoom(unique("search_title"));

  await page.goto("/");

  await page.getByPlaceholder("Название отеля").fill(seed.hotel_title);

  const searchResponsePromise = page.waitForResponse(
    (res) =>
      res.url().includes("/hotels") &&
      res.url().includes("title=") &&
      res.request().method() === "GET"
  );

  await page.getByRole("button", { name: /найти по названию/i }).click();

  const searchResponse = await searchResponsePromise;
  expect([200, 304]).toContain(searchResponse.status());

  await expect(page.locator("body")).toContainText(seed.hotel_title);
});

test("5. Открытие карточки отеля загружает доступные комнаты", async ({ page }) => {
  await createUserAndLogin(page);

  const seed = seedHotelRoom(unique("hotel_detail"));

  const roomsResponsePromise = page.waitForResponse(
    (res) =>
      res.url().includes(`/rooms/${seed.hotel_id}/rooms`) &&
      res.request().method() === "GET"
  );

  await page.goto(`/hotels/${seed.hotel_id}`);

  const roomsResponse = await roomsResponsePromise;
  expect(roomsResponse.status()).toBe(200);

  await expect(page.locator("body")).toContainText(seed.room_title);
  await expect(page.locator("body")).toContainText("3000");
});

test("6. Добавление питомца через форму сохраняет запись и показывает её после перезагрузки", async ({ page }) => {
  await createUserAndLogin(page);

  const petName = unique("Барсик");

  await createPetViaUi(page, petName);

  const petsResponse = await apiGet(page, "/pets/me");
  expect(petsResponse.status()).toBe(200);

  const pets = await petsResponse.json();

  expect(pets.some((p: any) => p.name === petName)).toBeTruthy();

  await page.reload();

  await expect(page.locator("body")).toContainText(petName);
  await expect(page.locator("body")).toContainText("Тихое место, без сквозняков");
});

test("7. Ввод некорректных параметров питомца приводит к ошибке валидации", async ({ page }) => {
  await createUserAndLogin(page);

  await page.goto("/pets");

  await page.getByPlaceholder("Имя питомца").fill(unique("InvalidTemp"));
  await page.locator('input[type="number"]').nth(0).fill("30");
  await page.locator('input[type="number"]').nth(1).fill("20");

  const dialogPromise = page.waitForEvent("dialog");

  const responsePromise = page.waitForResponse(
    (res) => res.url().endsWith("/pets") && res.request().method() === "POST"
  );

  await page.getByRole("button", { name: /добавить питомца/i }).click();

  const response = await responsePromise;
  expect(response.status()).toBe(422);

  const dialog = await dialogPromise;
  expect(dialog.message()).toMatch(/ошибка при создании питомца/i);
  await dialog.accept();
});

test("8. Изменение имени питомца через интерфейс обновляет данные в PostgreSQL и на странице", async ({ page }) => {
  await createUserAndLogin(page);

  const oldName = unique("ПитомецДо");
  const newName = unique("ПитомецПосле");

  await createPetViaUi(page, oldName);

  await page.getByRole("button", { name: /редактировать/i }).first().click();

  await expect(
    page.getByRole("heading", { name: /редактирование питомца/i })
  ).toBeVisible();

  const editArticle = page
    .locator("article", { hasText: /редактирование питомца/i })
    .first();

  await editArticle.locator("input").first().fill(newName);

  const patchResponsePromise = page.waitForResponse(
    (res) => /\/pets\/\d+$/.test(res.url()) && res.request().method() === "PATCH"
  );

  await editArticle.getByRole("button", { name: /^сохранить$/i }).click();

  const patchResponse = await patchResponsePromise;
  expect(patchResponse.status()).toBeLessThan(300);

  await expect(page.locator("body")).toContainText(newName);
  await expect(page.locator("body")).not.toContainText(oldName);

  const petsResponse = await apiGet(page, "/pets/me");
  expect(petsResponse.status()).toBe(200);

  const pets = await petsResponse.json();

  expect(pets.some((p: any) => p.name === newName)).toBeTruthy();
});

test("9. Удаление питомца из личного кабинета удаляет его из базы и со страницы", async ({ page }) => {
  await createUserAndLogin(page);

  const petName = unique("УдалитьПитомца");

  await createPetViaUi(page, petName);

  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toMatch(/удалить питомца|удалить/i);
    await dialog.accept();
  });

  const deleteResponsePromise = page.waitForResponse(
    (res) =>
      res.url().includes("/pets/") &&
      res.request().method() === "DELETE"
  );

  await page.getByRole("button", { name: /^удалить$/i }).first().click();

  const deleteResponse = await deleteResponsePromise;
  expect(deleteResponse.status()).toBeLessThan(300);

  await expect(page.locator("body")).not.toContainText(petName);

  const petsResponse = await apiGet(page, "/pets/me");
  expect(petsResponse.status()).toBe(200);

  const pets = await petsResponse.json();

  expect(pets.some((p: any) => p.name === petName)).toBeFalsy();
});

test("10. Выбор дат и бронирование комнаты создаёт бронь и отображает её в разделе 'Мои бронирования'", async ({ page }) => {
  const seed = seedHotelRoom(unique("booking"));

  await createUserAndLogin(page);

  const dateFrom = futureDate(3);
  const dateTo = futureDate(5);

  await page.goto(`/hotels/${seed.hotel_id}`);

  await page.locator('input[type="date"]').nth(0).fill(dateFrom);
  await page.locator('input[type="date"]').nth(1).fill(dateTo);

  const dialogPromise = page.waitForEvent("dialog");

  const bookingResponsePromise = page.waitForResponse(
    (res) => res.url().endsWith("/bookings") && res.request().method() === "POST"
  );

  await page.getByRole("button", { name: /забронировать/i }).first().click();

  const bookingResponse = await bookingResponsePromise;
  expect(bookingResponse.status()).toBeLessThan(300);

  const dialog = await dialogPromise;
  expect(dialog.message()).toMatch(/бронь создана/i);
  await dialog.accept();

  const apiBookings = await apiGet(page, "/bookings/me");
  expect(apiBookings.status()).toBe(200);

  const bookings = await apiBookings.json();

  expect(
    bookings.some(
      (b: any) => b.room_id === seed.room_id && b.date_from === dateFrom
    )
  ).toBeTruthy();

  await page.getByRole("button", { name: /мои бронирования/i }).click();

  await expect(
    page.getByRole("heading", { name: /мои бронирования/i })
  ).toBeVisible();

  await expect(page.locator("body")).toContainText(String(seed.room_id));
  await expect(page.locator("body")).toContainText(dateFrom);
  await expect(page.locator("body")).toContainText(dateTo);
});

test("11. Попытка выбрать некорректную дату не создаёт бронирование", async ({ page }) => {
  const seed = seedHotelRoom(unique("past_booking"));

  await createUserAndLogin(page);

  await page.goto(`/hotels/${seed.hotel_id}`);

  const yesterday = futureDate(-1);
  const tomorrow = futureDate(1);

  await page.locator('input[type="date"]').nth(0).evaluate((el, value) => {
    const input = el as HTMLInputElement;
    input.value = value as string;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, yesterday);

  await page.locator('input[type="date"]').nth(1).evaluate((el, value) => {
    const input = el as HTMLInputElement;
    input.value = value as string;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, tomorrow);

  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toMatch(
      /выбери даты|нельзя бронировать даты в прошлом|нельзя бронировать комнаты в прошлом|ошибка/i
    );
    await dialog.accept();
  });

  await page.getByRole("button", { name: /забронировать/i }).first().click();

  const bookingsResponse = await apiGet(page, "/bookings/me");
  expect(bookingsResponse.status()).toBe(200);

  const bookings = await bookingsResponse.json();

  expect(
    bookings.some((b: any) => {
      return b.room_id === seed.room_id && b.date_from === yesterday;
    })
  ).toBeFalsy();
});
