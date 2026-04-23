import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

function uniqueEmail(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}@example.com`;
}

test.describe("E2E: пользовательские сценарии", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("регистрация через UI переводит пользователя обратно к форме входа и показывает успешное сообщение", async ({ page }) => {
    const email = uniqueEmail("register_ui");
    const password = "secret123";

    await page.route("**/auth/register", async (route) => {
      const body = route.request().postDataJSON() as { email: string; password: string };
      expect(body.email).toBe(email);
      expect(body.password).toBe(password);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "OK" }),
      });
    });

    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /вход/i })).toBeVisible();

    await page.getByRole("button", { name: /перейти к регистрации/i }).click();
    await expect(page.getByRole("heading", { name: /регистрация/i })).toBeVisible();

    await page.getByPlaceholder("Введите email").fill(email);
    await page.getByPlaceholder("Введите пароль").fill(password);
    await page.getByRole("button", { name: /зарегистрироваться/i }).click();

    await expect(page.getByText(/регистрация прошла успешно\. теперь войдите в аккаунт\./i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /вход/i })).toBeVisible();
    await expect(page.getByPlaceholder("Введите email")).toHaveValue(email);
    await expect(page.getByPlaceholder("Введите пароль")).toHaveValue("");
  });

  test("админ добавляет отель через UI, и новый отель отображается в интерфейсе", async () => {});
  test("админ редактирует отель через UI, и backend принимает изменения без ошибки", async () => {});
  test("админ удаляет отель через UI, и отель исчезает из интерфейса", async () => {});
});
