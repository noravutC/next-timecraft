import { test, expect } from "@playwright/test";

test.describe("login page", () => {
  test("renders the Google sign-in option", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText(/google/i).first()).toBeVisible();
  });

  test("unauthenticated visitor is redirected away from the board", async ({
    page,
  }) => {
    await page.goto("/project");
    await page.waitForURL(/\/login/);
    expect(new URL(page.url()).pathname).toBe("/login");
  });
});
