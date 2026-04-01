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

test.describe("E2E: питомцы", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("пользователь добавляет питомца через UI, и он отображается после перезагрузки страницы", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("pet_create");
    const password = "secret123";
    const petName = uniquePetName("Барсик");

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

    await page
      .getByPlaceholder(/Например: нужен террариум, подогрев, тишина/i)
      .fill("Тихое место, без сквозняков");

    await page.getByPlaceholder(/Например: сухой корм/i).fill("Сухой корм");
    await page
      .getByPlaceholder(/Через запятую: rabies, complex/i)
      .fill("rabies, complex");

    // ВАЖНО: иначе backend отдаёт 422
    await selects.nth(1).selectOption("false"); // Нужна лицензия
    await selects.nth(2).selectOption("true");  // Можно совместное содержание

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
    await expect(page.locator("body")).toContainText("Кошка");
    await expect(page.locator("body")).toContainText("Тихое место, без сквозняков");

    const reloadPetsResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes("/pets/me") &&
        response.request().method() === "GET"
      );
    });

    await page.reload();

    const reloadPetsResponse = await reloadPetsResponsePromise;
    expect(reloadPetsResponse.status()).toBe(200);

    await expect(page.locator("body")).toContainText(petName);
    await expect(page.locator("body")).toContainText("Тихое место, без сквозняков");
  });
});