import { test, expect } from "@playwright/test";

test.describe("Home page (Leaderboard)", () => {
  test("tải được home page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("http://localhost:3000/");
    await expect(page).not.toHaveURL(/sign-in/);
  });

  test("hiển thị tiêu đề app 'Thành Hội: LIMITED'", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Thành Hội|LIMITED/);
  });

  test("trang không bị crash (không có 500 error)", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(500);
  });
});
