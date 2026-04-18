# Test Setup (Vitest + Playwright) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cài đặt Vitest cho unit tests (pure functions) và Playwright cho E2E tests (browser flows).

**Architecture:** Vitest chạy test thuần logic không cần DB/auth (ví dụ `sort.ts`). Playwright chạy E2E trên dev server thật với browser Chromium, kiểm tra các flow người dùng quan trọng.

**Tech Stack:** Vitest 3.x, @playwright/test 1.x, TypeScript, Next.js 15, SQLite (Turso/libSQL)

---

## File Structure

| File | Vai trò |
|------|---------|
| `vitest.config.ts` | Cấu hình Vitest: alias `@/`, environment node |
| `src/__tests__/sort.test.ts` | Unit tests cho `src/lib/sort.ts` |
| `playwright.config.ts` | Cấu hình Playwright: baseURL, webServer |
| `e2e/sign-in.spec.ts` | E2E: trang đăng nhập render đúng |
| `e2e/home.spec.ts` | E2E: home page load, leaderboard hiển thị |
| `e2e/protected.spec.ts` | E2E: route protected redirect sang sign-in |
| `package.json` | Thêm scripts: `test`, `test:watch`, `test:e2e` |

---

## Task 1: Cài Vitest và cấu hình

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Cài packages Vitest**

```bash
npm install -D vitest
```

Expected: vitest xuất hiện trong `devDependencies` của `package.json`.

- [ ] **Step 2: Tạo `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 3: Thêm scripts vào `package.json`**

Trong `"scripts"`, thêm sau dòng `"lint"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Xác nhận Vitest chạy được (chưa có test file)**

```bash
npm test
```

Expected output: `No test files found` hoặc `0 tests passed` — không có lỗi crash.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: add vitest setup"
```

---

## Task 2: Unit tests cho `sort.ts`

**Files:**
- Create: `src/__tests__/sort.test.ts`

Source file cần test: `src/lib/sort.ts`
- `qualityOrder`: map Quality → số thứ tự (DO=1, CAM=2, TIM=3, XANH_LAM=4, XANH_LAC=5)
- `qualityLabel`: map Quality → tên tiếng Việt
- `qualityColor`: map Quality → hex color
- `sortFlowersByQuality(flowers)`: sort array theo quality cao → thấp

- [ ] **Step 1: Tạo test file với các test thất bại**

Tạo file `src/__tests__/sort.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  qualityOrder,
  qualityLabel,
  qualityColor,
  sortFlowersByQuality,
} from "@/lib/sort";

describe("qualityOrder", () => {
  it("DO (đỏ) có rank cao nhất (số nhỏ nhất = 1)", () => {
    expect(qualityOrder.DO).toBe(1);
  });

  it("XANH_LAC (xanh lá) có rank thấp nhất (số lớn nhất = 5)", () => {
    expect(qualityOrder.XANH_LAC).toBe(5);
  });

  it("thứ tự đúng: DO < CAM < TIM < XANH_LAM < XANH_LAC", () => {
    expect(qualityOrder.DO).toBeLessThan(qualityOrder.CAM);
    expect(qualityOrder.CAM).toBeLessThan(qualityOrder.TIM);
    expect(qualityOrder.TIM).toBeLessThan(qualityOrder.XANH_LAM);
    expect(qualityOrder.XANH_LAM).toBeLessThan(qualityOrder.XANH_LAC);
  });

  it("5 quality có 5 rank khác nhau", () => {
    const values = Object.values(qualityOrder);
    expect(new Set(values).size).toBe(5);
  });
});

describe("qualityLabel", () => {
  it("DO → 'Đỏ'", () => {
    expect(qualityLabel.DO).toBe("Đỏ");
  });

  it("XANH_LAC → 'Xanh lá'", () => {
    expect(qualityLabel.XANH_LAC).toBe("Xanh lá");
  });

  it("tất cả 5 quality đều có label", () => {
    const keys: (keyof typeof qualityLabel)[] = [
      "DO",
      "CAM",
      "TIM",
      "XANH_LAM",
      "XANH_LAC",
    ];
    for (const key of keys) {
      expect(qualityLabel[key]).toBeTruthy();
    }
  });
});

describe("qualityColor", () => {
  it("mỗi color là chuỗi hex hợp lệ (#RRGGBB)", () => {
    const keys: (keyof typeof qualityColor)[] = [
      "DO",
      "CAM",
      "TIM",
      "XANH_LAM",
      "XANH_LAC",
    ];
    for (const key of keys) {
      expect(qualityColor[key]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe("sortFlowersByQuality", () => {
  it("sắp xếp từ quality cao nhất (DO) đến thấp nhất (XANH_LAC)", () => {
    const flowers = [
      { quality: "XANH_LAC" as const, name: "Cỏ" },
      { quality: "DO" as const, name: "Hoa đỏ" },
      { quality: "CAM" as const, name: "Hoa cam" },
      { quality: "TIM" as const, name: "Hoa tím" },
      { quality: "XANH_LAM" as const, name: "Hoa lam" },
    ];
    const sorted = sortFlowersByQuality(flowers);
    expect(sorted.map((f) => f.quality)).toEqual([
      "DO",
      "CAM",
      "TIM",
      "XANH_LAM",
      "XANH_LAC",
    ]);
  });

  it("không mutate array gốc", () => {
    const flowers = [
      { quality: "XANH_LAC" as const },
      { quality: "DO" as const },
    ];
    const original = [...flowers];
    sortFlowersByQuality(flowers);
    expect(flowers[0].quality).toBe(original[0].quality);
    expect(flowers[1].quality).toBe(original[1].quality);
  });

  it("trả về array rỗng khi input rỗng", () => {
    expect(sortFlowersByQuality([])).toEqual([]);
  });

  it("array 1 phần tử trả về chính nó", () => {
    const flowers = [{ quality: "TIM" as const, name: "Tím" }];
    expect(sortFlowersByQuality(flowers)).toEqual(flowers);
  });

  it("giữ nguyên thứ tự khi các flower cùng quality", () => {
    const flowers = [
      { quality: "CAM" as const, name: "A" },
      { quality: "CAM" as const, name: "B" },
    ];
    const sorted = sortFlowersByQuality(flowers);
    expect(sorted[0].name).toBe("A");
    expect(sorted[1].name).toBe("B");
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận pass (vì sort.ts đã implement)**

```bash
npm test
```

Expected: `13 tests passed` (tất cả pass, không có fail).

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/sort.test.ts
git commit -m "test: add unit tests for sort utilities"
```

---

## Task 3: Cài Playwright và cấu hình

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/` (directory)
- Modify: `package.json`

- [ ] **Step 1: Cài @playwright/test**

```bash
npm install -D @playwright/test
```

- [ ] **Step 2: Cài browser Chromium**

```bash
npx playwright install chromium
```

Expected: tải xuống Chromium browser binary (~150MB).

- [ ] **Step 3: Tạo `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
```

> Lưu ý: `reuseExistingServer: true` — nếu dev server đã chạy (port 3000), Playwright dùng lại. Nếu chưa chạy, Playwright tự start.

- [ ] **Step 4: Thêm scripts vào `package.json`**

```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

- [ ] **Step 5: Tạo thư mục e2e và file .gitkeep**

```bash
mkdir -p e2e
```

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts package.json package-lock.json
git commit -m "chore: add playwright setup"
```

---

## Task 4: E2E test — Trang đăng nhập

**Files:**
- Create: `e2e/sign-in.spec.ts`

Trang `/sign-in` là public, không cần auth. Có button "Đăng nhập bằng Google".

- [ ] **Step 1: Viết test cho trang sign-in**

Tạo file `e2e/sign-in.spec.ts`:

```ts
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
```

- [ ] **Step 2: Chạy E2E test (cần dev server đang chạy trước hoặc Playwright tự start)**

```bash
npm run test:e2e -- e2e/sign-in.spec.ts
```

Expected: `4 passed` — tất cả pass.

Nếu fail với lỗi timeout server start: chạy `npm run dev` trong terminal khác trước, rồi chạy lại.

- [ ] **Step 3: Commit**

```bash
git add e2e/sign-in.spec.ts
git commit -m "test: add E2E tests for sign-in page"
```

---

## Task 5: E2E test — Home page và protected routes

**Files:**
- Create: `e2e/home.spec.ts`
- Create: `e2e/protected.spec.ts`

Middleware chỉ bảo vệ `/stats` và `/admin`. Home page (`/`) là public.

- [ ] **Step 1: Viết test cho home page**

Tạo file `e2e/home.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test.describe("Home page (Leaderboard)", () => {
  test("tải được home page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("http://localhost:3000/");
    // Không redirect đến sign-in vì home không protected
    await expect(page).not.toHaveURL(/sign-in/);
  });

  test("hiển thị tiêu đề app 'Thành Hội: LIMITED'", async ({ page }) => {
    await page.goto("/");
    // Kiểm tra title tag
    await expect(page).toHaveTitle(/Thành Hội|LIMITED/);
  });

  test("trang không bị crash (không có 500 error)", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(500);
  });
});
```

- [ ] **Step 2: Viết test cho protected routes**

Tạo file `e2e/protected.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test.describe("Protected routes (chưa đăng nhập)", () => {
  test("/stats redirect đến sign-in khi chưa đăng nhập", async ({ page }) => {
    await page.goto("/stats");
    // NextAuth redirect sang sign-in
    await expect(page).toHaveURL(/sign-in/);
  });

  test("/admin redirect đến sign-in khi chưa đăng nhập", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/sign-in/);
  });
});
```

- [ ] **Step 3: Chạy tất cả E2E tests**

```bash
npm run test:e2e
```

Expected: `9 passed` (4 sign-in + 3 home + 2 protected).

- [ ] **Step 4: Commit**

```bash
git add e2e/home.spec.ts e2e/protected.spec.ts
git commit -m "test: add E2E tests for home and protected routes"
```

---

## Tổng kết lệnh chạy test

| Lệnh | Mục đích |
|------|----------|
| `npm test` | Chạy tất cả unit tests (Vitest) |
| `npm run test:watch` | Vitest watch mode (auto re-run khi save) |
| `npm run test:e2e` | Chạy tất cả E2E tests (Playwright) |
| `npm run test:e2e:ui` | Playwright UI mode (debug visual) |
| `npx playwright show-report` | Xem HTML report sau khi chạy E2E |

> **Lưu ý E2E:** Dev server phải chạy hoặc để Playwright tự start (mất ~30s lần đầu). Tốt nhất chạy `npm run dev` trước rồi `npm run test:e2e`.
