import { expect } from "@playwright/test";

import { test } from "../fixtures/setup";

test.describe("Authentication Validation", () => {
  test("Can't bypass authentication", async ({ page }) => {
    await page.goto("/models");
    await expect(page.getByText("Log in to the dashboard")).toBeVisible();

    await page.goto("/controllers");
    await expect(page.getByText("Log in to the dashboard")).toBeVisible();
  });

  test("Needs valid credentials", async ({ authHelpers }) => {
    const errorElement = await authHelpers.loginWithError(
      "invalid-user",
      "password",
    );
    await expect(errorElement).toBeVisible();
  });

  test("Needs re-login if cookie/local storage value is corrupted", async ({
    page,
    context,
    authHelpers,
  }) => {
    test.skip(process.env.AUTH_MODE === "local");
    await authHelpers.login();

    if (process.env.AUTH_MODE === "candid") {
      await page.evaluate(() => window.localStorage.clear());
      await expect(
        page.getByText("Controller authentication required").first(),
      ).toBeVisible();
      await expect(page.getByText("Authenticate").first()).toBeVisible();
    } else {
      await context.addCookies([
        {
          name: "jimm-browser-session",
          value: "random",
          path: "/",
          domain: "localhost",
        },
      ]);
      await expect(
        page.getByText("Authentication error.").first(),
      ).toBeVisible();
      await expect(
        page.getByText("Log in to the dashboard").first(),
      ).toBeVisible();
    }
  });
});
