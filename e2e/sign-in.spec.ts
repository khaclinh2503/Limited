import { test, expect } from "@playwright/test";

test.describe("Trang đăng nhập", () => {
  test("tiêu đề trang hiển thị đúng", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page).toHaveTitle(/Thành Hội: LIMITED/);
  });

  test("hiển thị tên app 'Thành Hội: LIMITED'", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(
      page.getByRole("heading", { name: "Thành Hội: LIMITED" })
    ).toBeVisible();
  });

  test("hiển thị button đăng nhập Google", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(
      page.getByRole("button", { name: /Đăng nhập bằng Google/i })
    ).toBeVisible();
  });

  test("hiển thị mô tả về quyền truy cập", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(
      page.getByText(/Chỉ thành viên công hội/i)
    ).toBeVisible();
  });
});
