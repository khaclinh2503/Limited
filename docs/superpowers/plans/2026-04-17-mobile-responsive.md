# Mobile Responsive Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm toàn bộ app Thành Hội: LIMITED hoạt động tốt trên màn hình mobile (~375px), bao gồm navigation compact, tab layout cho stats, flower grid 4 cột, admin page public với card list mobile, và FlowerOwnersModal mới.

**Architecture:** Tailwind breakpoint classes thuần (`sm:`, `lg:`), không tạo component mới ngoại trừ `FlowerOwnersModal`. Admin page mở public (bỏ auth guard ở layout + middleware), action buttons chỉ render khi `isAdmin === true`. StatsClient thêm tab state cho mobile, desktop giữ nguyên grid layout.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind 3, Framer Motion 11, Prisma 6, TypeScript strict

---

## File map

| File | Thay đổi |
|------|----------|
| `src/middleware.ts` | Bỏ `/admin/:path*` khỏi matcher |
| `src/app/admin/layout.tsx` | Bỏ `requireAdmin()`, thành passthrough |
| `src/app/admin/page.tsx` | Gọi `auth()` optional, truyền `isAdmin` xuống AdminClient |
| `src/app/actions/flower-types.ts` | Thêm `getFlowerOwners(flowerTypeId)` |
| `src/components/FlowerOwnersModal.tsx` | **Mới** — modal danh sách thành viên sở hữu hoa |
| `src/components/Navigation.tsx` | Icon-only mobile, full text từ `sm:` |
| `src/components/FlowerGrid.tsx` | `grid-cols-4` mobile, ảnh responsive, `break-words` |
| `src/components/PlayerModal.tsx` | `w-[95vw]`, padding responsive, thumbnail responsive |
| `src/components/StatsClient.tsx` | Tab state mobile + tab bar |
| `src/components/AdminClient.tsx` | `isAdmin` prop, click hoa → FlowerOwnersModal, mobile card list cả 3 tab |

---

## Task 1: Server action `getFlowerOwners`

**Files:**
- Modify: `src/app/actions/flower-types.ts`

- [ ] **Step 1: Thêm server action vào cuối file**

Mở `src/app/actions/flower-types.ts`, append vào sau `deleteFlowerType`:

```ts
export async function getFlowerOwners(flowerTypeId: string) {
  const ownerships = await prisma.flowerOwnership.findMany({
    where: { flowerTypeId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          ingameName: true,
          image: true,
          email: true,
        },
      },
    },
    orderBy: { user: { ingameName: "asc" } },
  });
  return ownerships.map((o) => o.user);
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd E:/workspace/Limited && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/flower-types.ts
git commit -m "feat: add getFlowerOwners server action"
```

---

## Task 2: Component `FlowerOwnersModal`

**Files:**
- Create: `src/components/FlowerOwnersModal.tsx`

- [ ] **Step 1: Tạo component**

```tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { getFlowerOwners } from "@/app/actions/flower-types";
import { qualityColor, qualityLabel } from "@/lib/sort";
import type { Quality } from "@prisma/client";

interface FlowerInfo {
  id: string;
  name: string;
  quality: Quality;
  imageUrl: string | null;
}

type Owner = {
  id: string;
  name: string | null;
  ingameName: string | null;
  image: string | null;
  email: string;
};

interface Props {
  flower: FlowerInfo | null;
  onClose: () => void;
}

export function FlowerOwnersModal({ flower, onClose }: Props) {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!flower) return;
    setOwners([]);
    startTransition(async () => {
      const data = await getFlowerOwners(flower.id);
      setOwners(data);
    });
  }, [flower]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const color = flower ? qualityColor[flower.quality] : "#F5A623";

  return (
    <AnimatePresence>
      {flower && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}
          onClick={onClose}
        >
          <motion.div
            key="modal"
            initial={{ scale: 0.9, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 24, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 320 }}
            className="card-gradient w-[95vw] sm:w-full sm:max-w-md max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-3">
                {flower.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={flower.imageUrl}
                    alt={flower.name}
                    className="w-10 h-10 rounded-lg object-cover"
                    style={{ border: `2px solid ${color}` }}
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                    style={{ background: `${color}22`, border: `2px solid ${color}` }}
                  >
                    🌸
                  </div>
                )}
                <div>
                  <h3 className="font-bold leading-tight">{flower.name}</h3>
                  <p className="text-xs font-semibold" style={{ color }}>
                    {qualityLabel[flower.quality]}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-[var(--zps-text-secondary)] hover:text-white text-xl leading-none p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[var(--zps-text-secondary)] uppercase tracking-wider mb-3 shrink-0">
              Thành viên sở hữu hoa này
            </p>

            {/* List */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {isPending ? (
                <div className="text-center py-8 text-[var(--zps-text-secondary)]">
                  <p className="text-2xl mb-2">⏳</p>
                  <p className="text-sm">Đang tải...</p>
                </div>
              ) : owners.length === 0 ? (
                <div className="text-center py-8 text-[var(--zps-text-secondary)]">
                  <p className="text-3xl mb-2">🌱</p>
                  <p className="text-sm">Chưa có ai sở hữu hoa này</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {owners.map((owner) => {
                    const displayName = owner.ingameName ?? owner.name ?? owner.email.split("@")[0];
                    return (
                      <div key={owner.id} className="flex items-center gap-3 px-1 py-2 rounded-lg hover:bg-white/5 transition-colors">
                        {owner.image ? (
                          <Image
                            src={owner.image}
                            alt={displayName}
                            width={32}
                            height={32}
                            className="rounded-full shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[var(--zps-bg-elevated)] flex items-center justify-center text-xs font-bold shrink-0">
                            {displayName[0].toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{displayName}</p>
                          <p className="text-xs text-[var(--zps-text-secondary)] truncate">{owner.email}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd E:/workspace/Limited && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/FlowerOwnersModal.tsx
git commit -m "feat: add FlowerOwnersModal component"
```

---

## Task 3: Navigation responsive

**Files:**
- Modify: `src/components/Navigation.tsx`

- [ ] **Step 1: Rút ngắn logo và nav links trên mobile**

Trong `Navigation.tsx`, sửa phần Logo (dòng ~49-53):

```tsx
<Link href="/" className="flex items-center gap-2 shrink-0">
  <span className="text-xl">🌸</span>
  <span className="font-bold text-sm sm:text-base text-gradient">
    <span className="hidden sm:inline">Thành Hội: </span>LIMITED
  </span>
</Link>
```

- [ ] **Step 2: Sửa nav links dùng icon + hidden text**

Sửa hằng `navLinks` (dòng ~20-24) thêm field `icon`:

```tsx
const navLinks = [
  { href: "/", label: "Bảng xếp hạng", icon: "🏆" },
  { href: "/stats", label: "Hoa của tôi", icon: "🌸", requireAuth: true },
  { href: "/admin", label: "Quản trị", icon: "⚙️" },
];
```

Sửa render link bên trong `.map()` (dòng ~61-73):

```tsx
<Link
  key={link.href}
  href={link.href}
  className={`px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
    ${
      active
        ? "bg-[var(--zps-bg-elevated)] text-[var(--zps-text-primary)]"
        : "text-[var(--zps-text-secondary)] hover:text-[var(--zps-text-primary)] hover:bg-[var(--zps-overlay)]"
    }`}
>
  <span>{link.icon}</span>
  <span className="hidden sm:inline ml-1">{link.label}</span>
</Link>
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd E:/workspace/Limited && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Navigation.tsx
git commit -m "feat: compact navigation on mobile — icon-only labels below sm breakpoint"
```

---

## Task 4: FlowerGrid responsive

**Files:**
- Modify: `src/components/FlowerGrid.tsx`

- [ ] **Step 1: Sửa grid columns và ảnh hoa**

Tìm dòng `<div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-5 gap-2">` (dòng ~161), đổi thành:

```tsx
<div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2">
```

- [ ] **Step 2: Sửa ảnh hoa từ hardcode sang responsive**

Tìm dòng `className="w-[64px] h-[64px] rounded-lg overflow-hidden...` (dòng ~181-185), đổi thành:

```tsx
<div
  className="w-full aspect-square rounded-lg overflow-hidden flex items-center justify-center mb-1 shrink-0"
  style={{
    background: "var(--zps-bg-page)",
    border: `1.5px solid ${isSelected ? color : "rgba(255,255,255,0.06)"}`,
  }}
>
```

- [ ] **Step 3: Thêm `break-words` vào tên hoa**

Tìm dòng tên hoa (dòng ~200-205):

```tsx
<p
  className="text-[10px] leading-tight line-clamp-2 break-words font-medium w-full text-center overflow-hidden"
  style={{ color: isSelected ? color : "var(--zps-text-secondary)" }}
>
  {flower.name}
</p>
```

(Bỏ `h-8` vì `line-clamp-2` đã giới hạn 2 dòng.)

- [ ] **Step 4: Verify TypeScript**

```bash
cd E:/workspace/Limited && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/FlowerGrid.tsx
git commit -m "feat: flower grid 4-col mobile, responsive image, break-words for long names"
```

---

## Task 5: PlayerModal responsive

**Files:**
- Modify: `src/components/PlayerModal.tsx`

- [ ] **Step 1: Sửa modal container width và padding**

Tìm dòng `className="card-gradient w-full max-w-lg max-h-[88vh] overflow-y-auto"` (dòng ~65), đổi thành:

```tsx
className="card-gradient w-[95vw] sm:w-full sm:max-w-lg max-h-[88vh] overflow-y-auto p-4 sm:p-6"
```

Sau đó xóa `p-6` hoặc padding khác trong `card-gradient` nếu có (card-gradient đã có padding sẵn trong globals.css — để nguyên, Tailwind sẽ override với `p-4 sm:p-6`).

- [ ] **Step 2: Sửa thumbnail top hoa sang responsive**

Tìm dòng `className="w-[68px] h-[68px] rounded-xl overflow-hidden...` (dòng ~141-146), đổi thành:

```tsx
<div
  className="w-10 h-10 sm:w-[60px] sm:h-[60px] rounded-xl overflow-hidden flex items-center justify-center"
  style={{
    background: "var(--zps-bg-elevated)",
    border: `2px solid ${color}`,
    boxShadow: `0 0 12px ${color}55`,
  }}
>
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd E:/workspace/Limited && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/PlayerModal.tsx
git commit -m "feat: PlayerModal responsive width and thumbnail size"
```

---

## Task 6: StatsClient 2-tab mobile

**Files:**
- Modify: `src/components/StatsClient.tsx`

- [ ] **Step 1: Thêm tab state**

Trong `StatsClient`, thêm import và state (sau dòng `const [toast, ...`):

```tsx
const [activeTab, setActiveTab] = useState<"flowers" | "profile">("flowers");
```

- [ ] **Step 2: Thêm tab bar (chỉ hiện trên mobile)**

Trong JSX, thêm tab bar ngay sau `<div className="shrink-0">` (phần title, dòng ~62-65):

```tsx
{/* Tab bar — chỉ hiện trên mobile, ẩn trên lg */}
<div className="flex lg:hidden gap-2 shrink-0">
  {(["flowers", "profile"] as const).map((tab) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
        activeTab === tab
          ? "bg-[var(--zps-bg-elevated)] text-[var(--zps-text-primary)]"
          : "text-[var(--zps-text-secondary)] hover:text-[var(--zps-text-primary)]"
      }`}
    >
      {tab === "flowers" ? "🌸 Hoa của tôi" : "👤 Hồ sơ"}
    </button>
  ))}
</div>
```

- [ ] **Step 3: Conditional render các cột**

Tìm `{/* ── Cột trái: Profile ── */}` (dòng ~70):

```tsx
{/* ── Cột trái: Profile ── */}
<div className={`card-gradient flex flex-col gap-4 overflow-y-auto ${activeTab === "profile" ? "block" : "hidden"} lg:block`}>
```

Tìm `{/* ── Cột phải: Flower grid ── */}` (dòng ~163):

```tsx
{/* ── Cột phải: Flower grid ── */}
<div className={`lg:col-span-2 card-gradient flex flex-col ${activeTab === "flowers" ? "block" : "hidden"} lg:block`}>
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd E:/workspace/Limited && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/StatsClient.tsx
git commit -m "feat: stats page 2-tab layout on mobile (flowers/profile)"
```

---

## Task 7: Admin page — mở public + truyền isAdmin

**Files:**
- Modify: `src/middleware.ts`
- Modify: `src/app/admin/layout.tsx`
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Bỏ `/admin` khỏi middleware matcher**

Sửa `src/middleware.ts`:

```ts
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/stats/:path*"],
};
```

- [ ] **Step 2: Bỏ guard trong admin/layout.tsx**

Sửa `src/app/admin/layout.tsx`:

```tsx
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

- [ ] **Step 3: Truyền isAdmin xuống AdminClient trong admin/page.tsx**

Sửa `src/app/admin/page.tsx`:

```tsx
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminClient } from "@/components/AdminClient";
import { sortFlowersByQuality } from "@/lib/sort";

export const metadata: Metadata = {
  title: "Quản trị — Thành Hội: LIMITED",
};

export default async function AdminPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const [rawFlowers, users, seasons] = await Promise.all([
    prisma.flowerType.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { ownerships: true } } },
    }),
    prisma.user.findMany({
      orderBy: [{ approved: "asc" }, { createdAt: "asc" }],
      include: {
        _count: { select: { ownerships: true } },
        ownerships: { select: { flowerTypeId: true } },
      },
    }),
    prisma.seasonResult.findMany({ orderBy: { season: "asc" } }),
  ]);

  const flowers = sortFlowersByQuality(rawFlowers);
  return <AdminClient flowers={flowers} users={users} seasons={seasons} isAdmin={isAdmin} />;
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd E:/workspace/Limited && npx tsc --noEmit
```

Expected: lỗi TypeScript vì `AdminClient` chưa nhận prop `isAdmin` — sẽ fix ở Task 8.

- [ ] **Step 5: Commit sau khi Task 8 xong** (skip đến Task 8 trước)

---

## Task 8: AdminClient — isAdmin prop + FlowerOwnersModal + mobile cards

**Files:**
- Modify: `src/components/AdminClient.tsx`

### 8a — Thêm `isAdmin` prop và FlowerOwnersModal vào FlowerCatalogTab

- [ ] **Step 1: Thêm `isAdmin` vào Props và truyền xuống các sub-tabs**

Tìm `interface Props` (dòng ~45):

```tsx
interface Props {
  flowers: Flower[];
  users: User[];
  seasons: SeasonResult[];
  isAdmin: boolean;
}
```

Tìm `export function AdminClient({ flowers, users, seasons }: Props)` (dòng ~61):

```tsx
export function AdminClient({ flowers, users, seasons, isAdmin }: Props) {
```

Tìm phần render các tab (dòng ~100-108), truyền `isAdmin` xuống:

```tsx
<div className="flex-1 min-h-0">
  {tab === "flowers" ? (
    <FlowerCatalogTab flowers={flowers} isAdmin={isAdmin} />
  ) : tab === "members" ? (
    <MembersTab users={users} flowers={flowers} isAdmin={isAdmin} />
  ) : (
    <SeasonsTab seasons={seasons} isAdmin={isAdmin} />
  )}
</div>
```

- [ ] **Step 2: Cập nhật signature `FlowerCatalogTab`**

Tìm `function FlowerCatalogTab({ flowers }: { flowers: Flower[] })` (dòng ~115):

```tsx
function FlowerCatalogTab({ flowers, isAdmin }: { flowers: Flower[]; isAdmin: boolean }) {
```

Thêm state `flowerOwnersTarget` và import `FlowerOwnersModal` vào đầu file:

```tsx
import { FlowerOwnersModal } from "@/components/FlowerOwnersModal";
```

Trong `FlowerCatalogTab`, thêm state (sau `const [search, setSearch] = useState("")`):

```tsx
const [flowerOwnersTarget, setFlowerOwnersTarget] = useState<Flower | null>(null);
```

- [ ] **Step 3: Ẩn nút "Thêm loại hoa" khi không phải admin**

Tìm dòng nút "Thêm loại hoa" (dòng ~181):

```tsx
{isAdmin && (
  <button onClick={openAdd} className="btn-primary py-2 px-4 text-sm rounded-lg shrink-0">
    + Thêm loại hoa
  </button>
)}
```

- [ ] **Step 4: Thêm click handler vào flower row + ẩn Sửa/Xóa khi không phải admin**

Tìm `<div key={f.id} className="flex items-center gap-4 px-5 py-3">` (dòng ~237), đổi thành button clickable:

```tsx
<div
  key={f.id}
  className="flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-[var(--zps-overlay)] transition-colors"
  onClick={() => setFlowerOwnersTarget(f)}
>
```

Tìm phần Actions (dòng ~259-274), wrap bằng `isAdmin`:

```tsx
{isAdmin && (
  <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
    <button
      onClick={() => openEdit(f)}
      className="btn-secondary py-1.5 px-3 text-xs rounded-lg"
    >
      Sửa
    </button>
    <button
      onClick={() => setConfirmDelete(f)}
      className="py-1.5 px-3 text-xs rounded-lg font-semibold transition-colors text-red-400 hover:bg-red-500/10"
    >
      Xóa
    </button>
  </div>
)}
```

- [ ] **Step 5: Thêm `FlowerOwnersModal` vào cuối JSX của `FlowerCatalogTab`**

Ngay trước `{/* Add/Edit modal */}` (dòng ~280), thêm:

```tsx
<FlowerOwnersModal
  flower={flowerOwnersTarget}
  onClose={() => setFlowerOwnersTarget(null)}
/>
```

### 8b — Mobile card list cho FlowerCatalogTab

- [ ] **Step 6: Thêm "Tên" column header (mobile caption) và wrap list bằng desktop/mobile toggle**

Tìm `{/* Flower list */}` (dòng ~226), bọc nội dung bên trong với mobile card list song song:

Thay `<div className="card-gradient !p-0 flex-1 min-h-0 flex flex-col overflow-hidden">` và toàn bộ nội dung bên trong bằng:

```tsx
{/* Flower list */}
<div className="card-gradient !p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
  <div className="flex-1 overflow-y-auto">
    {filtered.length === 0 && (
      <div className="text-center py-12 text-[var(--zps-text-secondary)]">
        <p className="text-3xl mb-2">🌱</p>
        <p className="text-sm">{flowers.length === 0 ? "Chưa có hoa nào trong catalog" : "Không tìm thấy hoa nào"}</p>
      </div>
    )}

    {/* Mobile cards */}
    <div className="block sm:hidden divide-y divide-white/5">
      {filtered.map((f) => {
        const color = qualityColor[f.quality];
        return (
          <div
            key={f.id}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--zps-overlay)] transition-colors"
            onClick={() => setFlowerOwnersTarget(f)}
          >
            <div
              className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
              style={{ background: "var(--zps-bg-elevated)", border: `2px solid ${color}` }}
            >
              {f.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.imageUrl} alt={f.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg">🌸</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{f.name}</p>
              <p className="text-xs" style={{ color }}>
                {qualityLabel[f.quality]} · {f._count.ownerships} sở hữu
              </p>
            </div>
            {isAdmin && (
              <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => openEdit(f)}
                  className="btn-secondary py-1 px-2.5 text-xs rounded-lg"
                >
                  Sửa
                </button>
                <button
                  onClick={() => setConfirmDelete(f)}
                  className="py-1 px-2.5 text-xs rounded-lg font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Xóa
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>

    {/* Desktop rows */}
    <div className="hidden sm:block divide-y divide-white/5">
      {filtered.map((f) => {
        const color = qualityColor[f.quality];
        return (
          <div
            key={f.id}
            className="flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-[var(--zps-overlay)] transition-colors"
            onClick={() => setFlowerOwnersTarget(f)}
          >
            <div
              className="w-12 h-12 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
              style={{ background: "var(--zps-bg-elevated)", border: `2px solid ${color}` }}
            >
              {f.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.imageUrl} alt={f.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl">🌸</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{f.name}</p>
              <p className="text-xs font-semibold" style={{ color }}>
                {qualityLabel[f.quality]} · {f._count.ownerships} thành viên sở hữu
              </p>
            </div>
            {isAdmin && (
              <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => openEdit(f)}
                  className="btn-secondary py-1.5 px-3 text-xs rounded-lg"
                >
                  Sửa
                </button>
                <button
                  onClick={() => setConfirmDelete(f)}
                  className="py-1.5 px-3 text-xs rounded-lg font-semibold transition-colors text-red-400 hover:bg-red-500/10"
                >
                  Xóa
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
</div>
```

### 8c — MembersTab: isAdmin + mobile cards

- [ ] **Step 7: Cập nhật signature `MembersTab` và ẩn action buttons**

Tìm `function MembersTab({ users, flowers }: { users: User[]; flowers: Flower[] })` (dòng ~384):

```tsx
function MembersTab({ users, flowers, isAdmin }: { users: User[]; flowers: Flower[]; isAdmin: boolean }) {
```

Tìm `{/* Actions */}` trong MembersTab (dòng ~604), wrap toàn bộ div actions bằng `isAdmin`:

```tsx
{isAdmin && (
  <div className="flex items-center gap-2 shrink-0">
    {!u.approved ? (
      <>
        <button
          onClick={() => approve(u.id)}
          disabled={isPending}
          className="py-1.5 px-3 text-xs rounded-lg font-bold transition-colors disabled:opacity-50"
          style={{ background: "var(--zps-accent-green)", color: "#fff" }}
        >
          ✓ Duyệt
        </button>
        <button
          onClick={() => setConfirmDelete(u)}
          className="py-1.5 px-3 text-xs rounded-lg font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
        >
          Xóa
        </button>
      </>
    ) : (
      <>
        <select
          value={u.role}
          onChange={(e) => changeRole(u.id, e.target.value as "MEMBER" | "ADMIN")}
          disabled={isPending}
          className="text-xs rounded-lg px-2 py-1.5 font-semibold cursor-pointer disabled:opacity-50"
          style={{
            background: u.role === "ADMIN" ? "var(--zps-brand-gradient)" : "var(--zps-bg-elevated)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <option value="MEMBER">Thành viên</option>
          <option value="ADMIN">Quản trị</option>
        </select>
        <button
          onClick={() => setConfirmDelete(u)}
          className="py-1.5 px-3 text-xs rounded-lg font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
        >
          Xóa
        </button>
      </>
    )}
  </div>
)}
```

- [ ] **Step 8: Thêm mobile card view cho MembersTab**

Tìm `{/* ── Danh sách ── */}` trong MembersTab (dòng ~566), bọc nội dung list:

Thay nội dung bên trong `.flex-1.overflow-y-auto.divide-y` bằng 2 view song song:

```tsx
<div className="flex-1 overflow-y-auto">
  {filtered.length === 0 && (
    <div className="text-center py-12 text-[var(--zps-text-secondary)]">
      <p className="text-3xl mb-2">🔍</p>
      <p className="text-sm">Không tìm thấy thành viên nào</p>
    </div>
  )}

  {/* Mobile cards */}
  <div className="block sm:hidden divide-y divide-white/5">
    {filtered.map((u) => (
      <div
        key={u.id}
        className="flex items-center gap-3 px-4 py-3"
        style={!u.approved ? { borderLeft: "3px solid #E8341A", background: "rgba(232,52,26,0.04)" } : {}}
      >
        {u.image ? (
          <Image src={u.image} alt={displayName(u)} width={36} height={36} className="rounded-full shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-[var(--zps-bg-elevated)] flex items-center justify-center text-xs font-bold shrink-0">
            {displayName(u)[0].toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-medium truncate">{displayName(u)}</p>
            {!u.approved && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "#E8341A22", color: "#E8341A" }}>
                Chờ duyệt
              </span>
            )}
            {u.approved && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: u.role === "ADMIN" ? "var(--zps-brand-gradient)" : "var(--zps-bg-elevated)", color: "#fff" }}>
                {u.role === "ADMIN" ? "Admin" : "Member"}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--zps-text-secondary)] truncate">🌸 {u._count.ownerships} loại</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1.5 shrink-0">
            {!u.approved ? (
              <>
                <button
                  onClick={() => approve(u.id)}
                  disabled={isPending}
                  className="py-1 px-2 text-xs rounded-lg font-bold disabled:opacity-50"
                  style={{ background: "var(--zps-accent-green)", color: "#fff" }}
                >
                  ✓
                </button>
                <button
                  onClick={() => setConfirmDelete(u)}
                  className="py-1 px-2 text-xs rounded-lg font-semibold text-red-400 hover:bg-red-500/10"
                >
                  Xóa
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmDelete(u)}
                className="py-1 px-2 text-xs rounded-lg font-semibold text-red-400 hover:bg-red-500/10"
              >
                Xóa
              </button>
            )}
          </div>
        )}
      </div>
    ))}
  </div>

  {/* Desktop rows — giữ nguyên layout cũ */}
  <div className="hidden sm:block divide-y divide-white/5">
    {filtered.map((u) => (
      <div
        key={u.id}
        className="flex items-center gap-4 px-5 py-3"
        style={!u.approved ? { background: "rgba(232,52,26,0.05)", borderLeft: "3px solid #E8341A" } : {}}
      >
        {u.image ? (
          <Image src={u.image} alt={displayName(u)} width={40} height={40} className="rounded-full shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[var(--zps-bg-elevated)] flex items-center justify-center text-sm font-bold shrink-0">
            {displayName(u)[0].toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{displayName(u)}</p>
            {!u.approved && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "#E8341A22", color: "#E8341A" }}>
                Chờ duyệt
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--zps-text-secondary)] truncate">{u.email}</p>
          <p className="text-xs text-[var(--zps-text-secondary)]">🌸 {u._count.ownerships} loại hoa</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            {!u.approved ? (
              <>
                <button onClick={() => approve(u.id)} disabled={isPending} className="py-1.5 px-3 text-xs rounded-lg font-bold transition-colors disabled:opacity-50" style={{ background: "var(--zps-accent-green)", color: "#fff" }}>
                  ✓ Duyệt
                </button>
                <button onClick={() => setConfirmDelete(u)} className="py-1.5 px-3 text-xs rounded-lg font-semibold text-red-400 hover:bg-red-500/10 transition-colors">
                  Xóa
                </button>
              </>
            ) : (
              <>
                <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value as "MEMBER" | "ADMIN")} disabled={isPending} className="text-xs rounded-lg px-2 py-1.5 font-semibold cursor-pointer disabled:opacity-50" style={{ background: u.role === "ADMIN" ? "var(--zps-brand-gradient)" : "var(--zps-bg-elevated)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <option value="MEMBER">Thành viên</option>
                  <option value="ADMIN">Quản trị</option>
                </select>
                <button onClick={() => setConfirmDelete(u)} className="py-1.5 px-3 text-xs rounded-lg font-semibold text-red-400 hover:bg-red-500/10 transition-colors">
                  Xóa
                </button>
              </>
            )}
          </div>
        )}
      </div>
    ))}
  </div>
</div>
```

### 8d — SeasonsTab: isAdmin + mobile cards

- [ ] **Step 9: Cập nhật signature `SeasonsTab` và ẩn nút admin**

Tìm `function SeasonsTab({ seasons }: { seasons: SeasonResult[] })` (dòng ~742):

```tsx
function SeasonsTab({ seasons, isAdmin }: { seasons: SeasonResult[]; isAdmin: boolean }) {
```

Tìm nút `+ Thêm mùa` (dòng ~801):

```tsx
{isAdmin && (
  <button onClick={openAdd} className="btn-primary !py-2 !px-4 text-sm">
    + Thêm mùa
  </button>
)}
```

- [ ] **Step 10: Thêm mobile card view cho SeasonsTab**

Tìm `{/* Table */}` (dòng ~807), thêm mobile card list TRƯỚC `<table>`:

```tsx
{/* Mobile cards */}
{seasons.length > 0 && (
  <div className="block sm:hidden divide-y divide-white/5">
    {seasons.map((s) => (
      <div key={s.id} className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">Mùa {s.season}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span
              className="text-xs px-2 py-0.5 rounded-lg font-bold"
              style={{
                background: `${TIER_COLOR[s.tier] ?? "#888"}22`,
                color: TIER_COLOR[s.tier] ?? "#888",
                border: `1px solid ${TIER_COLOR[s.tier] ?? "#888"}44`,
              }}
            >
              Hạng {s.tier}
            </span>
            <span className="text-xs text-[var(--zps-text-secondary)]">
              {s.rank === 1 ? "🥇" : s.rank === 2 ? "🥈" : s.rank === 3 ? "🥉" : `#${s.rank}`} · {s.points} điểm
            </span>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2 shrink-0">
            <button onClick={() => openEdit(s)} className="btn-secondary py-1 px-2.5 text-xs rounded-lg">Sửa</button>
            <button onClick={() => confirmDel(s)} className="py-1 px-2.5 text-xs rounded-lg font-semibold text-red-400 hover:bg-red-500/10">Xóa</button>
          </div>
        )}
      </div>
    ))}
  </div>
)}

```

Wrap toàn bộ `<table>` block hiện có trong SeasonsTab bằng `<div className="hidden sm:block">`: tìm dòng `<table className="w-full text-sm">`, thêm `<div className="hidden sm:block">` ngay trước nó và `</div>` ngay sau `</table>`.

Tìm nút Sửa/Xóa trong `<tbody>` của table (dòng ~846-860), wrap bằng `isAdmin`:

```tsx
{isAdmin && (
  <td className="px-5 py-3">
    <div className="flex gap-2">
      <button onClick={() => openEdit(s)} className="btn-secondary py-1.5 px-3 text-xs rounded-lg">Sửa</button>
      <button onClick={() => confirmDel(s)} className="py-1.5 px-3 text-xs rounded-lg font-semibold text-red-400 hover:bg-red-500/10 transition-colors">Xóa</button>
    </div>
  </td>
)}
```

- [ ] **Step 11: Verify TypeScript toàn bộ**

```bash
cd E:/workspace/Limited && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 12: Commit Task 7 + Task 8 cùng nhau**

```bash
git add src/middleware.ts src/app/admin/layout.tsx src/app/admin/page.tsx src/components/AdminClient.tsx
git commit -m "feat: admin page public view, isAdmin guards, mobile card lists, FlowerOwnersModal integration"
```

---

## Kiểm tra cuối

- [ ] Chạy dev server: `npm run dev`
- [ ] Mở Chrome DevTools → Toggle device toolbar → chọn iPhone SE (375px)
- [ ] Kiểm tra từng màn hình:
  - `/` — Navigation vừa 1 hàng, BXH hiển thị đúng
  - `/stats` — Tab "🌸 Hoa của tôi" active mặc định, tab "👤 Hồ sơ" switch đúng
  - `/stats` (flower grid) — 4 cột, tên dài không tràn
  - `/admin` — 3 tab hoạt động, card list hiển thị trên mobile
  - `/admin` (logged in non-admin) — không thấy nút Thêm/Sửa/Xóa
  - Click hoa trong `/admin` → FlowerOwnersModal mở, hiện đúng danh sách / "Chưa có ai sở hữu hoa này 🌱"
  - Click row BXH → PlayerModal vừa màn hình, thumbnail không tràn
