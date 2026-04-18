import { test, expect } from "@playwright/test";

test.describe("Protected routes (chưa đăng nhập)", () => {
  test("/stats redirect đến sign-in khi chưa đăng nhập", async ({ page }) => {
    await page.goto("/stats");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("/admin redirect đến sign-in khi chưa đăng nhập", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/sign-in/);
  });
});
