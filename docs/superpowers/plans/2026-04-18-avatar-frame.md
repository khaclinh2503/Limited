# Avatar + Frame Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hiển thị avatar Google dạng vuông bo góc với khung PNG trang trí chồng lên, member tự chọn khung trong trang Stats.

**Architecture:** Thêm field `frame` vào User model, tạo component `PlayerAvatar` dùng chung ở Leaderboard + PlayerModal, tạo `FramePicker` trong StatsClient để chọn khung.

**Tech Stack:** Next.js 15, Prisma SQLite, TypeScript, Tailwind CSS, next/image

---

## File Structure

| File | Action | Mô tả |
|------|--------|-------|
| `prisma/schema.prisma` | Modify | Thêm `frame String?` vào User |
| `src/lib/queries.ts` | Modify | Thêm `frame` vào select của getLeaderboard + getPlayerDetail |
| `src/components/PlayerAvatar.tsx` | Create | Component avatar + frame overlay |
| `src/app/actions/profile.ts` | Modify | Thêm `frame` vào ProfileSchema + getAvailableFrames action |
| `src/components/FramePicker.tsx` | Create | Grid chọn khung |
| `src/components/LeaderboardClient.tsx` | Modify | Dùng PlayerAvatar thay Image/fallback div |
| `src/components/PlayerModal.tsx` | Modify | Dùng PlayerAvatar thay Image/fallback div |
| `src/components/StatsClient.tsx` | Modify | Thêm FramePicker + frame state |
| `src/app/stats/page.tsx` | Modify | Fetch frame data + truyền xuống StatsClient |
| `src/__tests__/profile-frame.test.ts` | Create | Unit test validate frame path |

---

## Task 1: Prisma schema — thêm field `frame`

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Thêm field `frame` vào User model**

Mở `prisma/schema.prisma`, trong model `User`, thêm dòng sau sau `approved Boolean @default(false)`:

```prisma
frame          String?
```

Kết quả model User trông như sau (chỉ hiển thị phần thêm):
```prisma
model User {
  id             String    @id @default(cuid())
  email          String    @unique
  emailVerified  DateTime?
  name           String?
  image          String?
  ingameName     String?
  bio            String?
  gameId         String?
  zalo           String?
  frame          String?        // ← thêm dòng này
  role           Role      @default(MEMBER)
  approved       Boolean   @default(false)
  ...
}
```

- [ ] **Step 2: Push schema lên DB**

```bash
npm run db:push
```

Expected output: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add frame field to User model"
```

---

## Task 2: Cập nhật queries — thêm `frame` vào select

**Files:**
- Modify: `src/lib/queries.ts`

- [ ] **Step 1: Thêm `frame` vào getLeaderboard select**

Trong `getLeaderboard`, phần `select`, thêm `frame: true` sau `bio: true`:

```ts
select: {
  id: true,
  email: true,
  name: true,
  image: true,
  ingameName: true,
  bio: true,
  frame: true,       // ← thêm
  createdAt: true,
  _count: { select: { ownerships: true } },
},
```

Cập nhật return của `getLeaderboard`:

```ts
return users.map((u, i) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  image: u.image,
  ingameName: u.ingameName,
  bio: u.bio,
  frame: u.frame,    // ← thêm
  totalFlowers: u._count.ownerships,
  rank: i + 1,
}));
```

- [ ] **Step 2: Thêm `frame` vào getPlayerDetail select**

Trong `getPlayerDetail`, phần `select`, thêm `frame: true` sau `bio: true`:

```ts
select: {
  id: true,
  name: true,
  ingameName: true,
  image: true,
  bio: true,
  gameId: true,
  frame: true,       // ← thêm
  ownerships: { ... },
},
```

Cập nhật return của `getPlayerDetail`:

```ts
return {
  id: user.id,
  name: user.name,
  ingameName: user.ingameName,
  image: user.image,
  bio: user.bio,
  gameId: user.gameId,
  frame: user.frame,   // ← thêm
  totalFlowers: user.ownerships.length,
  topFlowers,
};
```

- [ ] **Step 3: Verify TypeScript compile**

```bash
npx tsc --noEmit
```

Expected: no errors (hoặc chỉ có lỗi ở LeaderboardClient/PlayerModal vì chưa dùng frame — bình thường).

- [ ] **Step 4: Commit**

```bash
git add src/lib/queries.ts
git commit -m "feat: include frame in leaderboard and player detail queries"
```

---

## Task 3: Component `PlayerAvatar`

**Files:**
- Create: `src/components/PlayerAvatar.tsx`
- Create: `src/__tests__/profile-frame.test.ts`

Context: Component này render avatar Google (hoặc initial chữ cái nếu không có ảnh) dạng vuông bo góc, với frame PNG chồng lên tràn ra 40% mỗi chiều.

- [ ] **Step 1: Viết unit test cho frame path validation**

Tạo `src/__tests__/profile-frame.test.ts`:

```ts
import { describe, it, expect } from "vitest";

const FRAME_REGEX = /^\/frame\/\d+\.png$/;

describe("frame path validation", () => {
  it("chấp nhận path hợp lệ", () => {
    expect(FRAME_REGEX.test("/frame/1.png")).toBe(true);
    expect(FRAME_REGEX.test("/frame/49.png")).toBe(true);
    expect(FRAME_REGEX.test("/frame/100.png")).toBe(true);
  });

  it("từ chối path không hợp lệ", () => {
    expect(FRAME_REGEX.test("/avatar/1.png")).toBe(false);
    expect(FRAME_REGEX.test("/frame/abc.png")).toBe(false);
    expect(FRAME_REGEX.test("frame/1.png")).toBe(false);
    expect(FRAME_REGEX.test("/frame/1.jpg")).toBe(false);
    expect(FRAME_REGEX.test("")).toBe(false);
  });
});
```

- [ ] **Step 2: Chạy test để verify fail**

```bash
npm test src/__tests__/profile-frame.test.ts
```

Expected: `5 passed` (regex là pure logic, không cần implement gì thêm).

- [ ] **Step 3: Tạo `PlayerAvatar` component**

Tạo `src/components/PlayerAvatar.tsx`:

```tsx
import Image from "next/image";

interface PlayerAvatarProps {
  image: string | null;
  name: string;
  frame: string | null;
  size: number;
}

export function PlayerAvatar({ image, name, frame, size }: PlayerAvatarProps) {
  const frameSize = Math.round(size * 1.4);
  const frameOffset = -Math.round(size * 0.2);
  const borderRadius = size >= 64 ? 16 : 12;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      {/* Avatar inner — clipped */}
      <div
        className="w-full h-full overflow-hidden"
        style={{ borderRadius }}
      >
        {image ? (
          <Image
            src={image}
            alt={name}
            width={size}
            height={size}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #4285F4, #EA4335)",
              fontSize: Math.round(size * 0.35),
            }}
          >
            {name[0]?.toUpperCase() ?? "?"}
          </div>
        )}
      </div>

      {/* Frame overlay — tràn ra ngoài */}
      {frame && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={frame}
          alt=""
          aria-hidden
          className="absolute pointer-events-none select-none"
          style={{
            width: frameSize,
            height: frameSize,
            top: frameOffset,
            left: frameOffset,
            objectFit: "contain",
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify TypeScript compile**

```bash
npx tsc --noEmit
```

Expected: no errors từ PlayerAvatar.tsx.

- [ ] **Step 5: Commit**

```bash
git add src/components/PlayerAvatar.tsx src/__tests__/profile-frame.test.ts
git commit -m "feat: add PlayerAvatar component with frame overlay"
```

---

## Task 4: Cập nhật profile actions

**Files:**
- Modify: `src/app/actions/profile.ts`

- [ ] **Step 1: Thêm `frame` vào ProfileSchema và updateMyProfile**

Thay toàn bộ nội dung `src/app/actions/profile.ts`:

```ts
"use server";

import { readdir } from "fs/promises";
import { join } from "path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ProfileSchema = z.object({
  ingameName: z.string().max(50).optional(),
  bio: z.string().max(200).optional(),
  gameId: z.string().max(50).optional(),
  zalo: z.string().max(50).optional(),
  frame: z
    .string()
    .regex(/^\/frame\/\d+\.png$/)
    .nullable()
    .optional(),
});

export async function updateMyProfile(data: z.infer<typeof ProfileSchema>) {
  const session = await auth();
  if (!session?.user) throw new Error("Chưa đăng nhập");

  const parsed = ProfileSchema.parse(data);

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ingameName: parsed.ingameName?.trim() || null,
      bio: parsed.bio?.trim() || null,
      gameId: parsed.gameId?.trim() || null,
      zalo: parsed.zalo?.trim() || null,
      frame: parsed.frame ?? undefined,
    },
  });

  revalidatePath("/stats");
  revalidatePath("/");
}

export async function getAvailableFrames(): Promise<string[]> {
  try {
    const dir = join(process.cwd(), "public", "frame");
    const files = await readdir(dir);
    return files
      .filter((f) => /^\d+\.png$/.test(f))
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map((f) => `/frame/${f}`);
  } catch {
    return [];
  }
}
```

- [ ] **Step 2: Verify TypeScript compile**

```bash
npx tsc --noEmit
```

Expected: no errors từ profile.ts.

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/profile.ts
git commit -m "feat: add frame to profile action and getAvailableFrames"
```

---

## Task 5: Component `FramePicker`

**Files:**
- Create: `src/components/FramePicker.tsx`

- [ ] **Step 1: Tạo FramePicker component**

Tạo `src/components/FramePicker.tsx`:

```tsx
"use client";

import { PlayerAvatar } from "@/components/PlayerAvatar";

interface FramePickerProps {
  availableFrames: string[];
  currentFrame: string | null;
  userImage: string | null;
  userName: string;
  onSelect: (frame: string | null) => void;
  disabled?: boolean;
}

export function FramePicker({
  availableFrames,
  currentFrame,
  userImage,
  userName,
  onSelect,
  disabled,
}: FramePickerProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--zps-text-secondary)] mb-2 uppercase tracking-wider">
        Khung avatar
      </label>
      <div className="grid grid-cols-6 gap-2">
        {/* Ô không khung */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelect(null)}
          className="relative flex items-center justify-center rounded-xl transition-all duration-150 disabled:opacity-50"
          style={{
            width: 52,
            height: 52,
            border: currentFrame === null
              ? "2px solid #f97316"
              : "2px dashed rgba(255,255,255,0.15)",
            boxShadow: currentFrame === null
              ? "0 0 8px rgba(249,115,22,0.4)"
              : "none",
          }}
          title="Không khung"
        >
          <PlayerAvatar image={userImage} name={userName} frame={null} size={44} />
        </button>

        {/* Các khung */}
        {availableFrames.map((frameUrl) => {
          const isActive = currentFrame === frameUrl;
          return (
            <button
              key={frameUrl}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(frameUrl)}
              className="relative flex items-center justify-center rounded-xl transition-all duration-150 disabled:opacity-50"
              style={{
                width: 52,
                height: 52,
                border: isActive
                  ? "2px solid #f97316"
                  : "2px solid transparent",
                boxShadow: isActive
                  ? "0 0 8px rgba(249,115,22,0.4)"
                  : "none",
              }}
              title={frameUrl}
            >
              <PlayerAvatar image={userImage} name={userName} frame={frameUrl} size={36} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compile**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/FramePicker.tsx
git commit -m "feat: add FramePicker component"
```

---

## Task 6: Cập nhật `LeaderboardClient`

**Files:**
- Modify: `src/components/LeaderboardClient.tsx`

- [ ] **Step 1: Thêm `frame` vào interface và dùng PlayerAvatar**

Thay toàn bộ nội dung `src/components/LeaderboardClient.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { getPlayerDetailAction } from "@/app/actions/player";
import { PlayerModal } from "@/components/PlayerModal";
import { PlayerAvatar } from "@/components/PlayerAvatar";

interface LeaderboardEntry {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  frame: string | null;
  ingameName: string | null;
  totalFlowers: number;
  rank: number;
}

interface PlayerDetail {
  id: string;
  name: string | null;
  ingameName: string | null;
  image: string | null;
  frame: string | null;
  bio: string | null;
  gameId: string | null;
  totalFlowers: number;
  topFlowers: {
    id: string;
    name: string;
    quality: import("@prisma/client").Quality;
    imageUrl: string | null;
  }[];
}

const RANK_BADGE: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function rankBadge(rank: number) {
  if (rank <= 3) return RANK_BADGE[rank];
  return rank.toString();
}

interface Props {
  data: LeaderboardEntry[];
  top1?: LeaderboardEntry;
}

export function LeaderboardClient({ data, top1 }: Props) {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerDetail | null>(null);
  const [, startTransition] = useTransition();

  function openPlayer(userId: string) {
    startTransition(async () => {
      const detail = await getPlayerDetailAction(userId);
      setSelectedPlayer(detail);
    });
  }

  const displayName = (entry: LeaderboardEntry) =>
    entry.ingameName ?? entry.name ?? entry.email.split("@")[0];

  return (
    <>
      {/* Rank #1 stat card */}
      {top1 && (
        <div
          className="card-gradient cursor-pointer rank-1-glow"
          onClick={() => openPlayer(top1.id)}
        >
          <p className="text-xs text-[var(--zps-text-secondary)] uppercase tracking-wider mb-3">
            🏆 Hạng #1
          </p>
          <div className="flex items-center gap-3">
            <PlayerAvatar
              image={top1.image}
              name={displayName(top1)}
              frame={top1.frame}
              size={52}
            />
            <div className="min-w-0">
              <p className="font-bold truncate">{displayName(top1)}</p>
              <p className="text-sm text-[var(--zps-brand-orange)] font-semibold">
                🌸 {top1.totalFlowers} loại hoa
              </p>
            </div>
          </div>
        </div>
      )}

      {/* BXH Table */}
      <div className="card-gradient !p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="font-bold text-lg">Bảng xếp hạng</h2>
          <p className="text-xs text-[var(--zps-text-secondary)] mt-0.5">
            Top {data.length} thành viên · Click để xem chi tiết
          </p>
        </div>

        {data.length === 0 ? (
          <div className="text-center py-16 text-[var(--zps-text-secondary)]">
            <p className="text-4xl mb-3">🌱</p>
            <p>Chưa có thành viên nào</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {data.map((entry) => (
              <button
                key={entry.id}
                onClick={() => openPlayer(entry.id)}
                className="leaderboard-row w-full flex items-center gap-4 px-6 py-4 text-left"
              >
                {/* Rank */}
                <div
                  className={`w-9 text-center font-bold text-sm shrink-0 ${
                    entry.rank <= 3 ? "text-xl" : "text-[var(--zps-text-secondary)]"
                  }`}
                >
                  {rankBadge(entry.rank)}
                </div>

                {/* Avatar */}
                <PlayerAvatar
                  image={entry.image}
                  name={displayName(entry)}
                  frame={entry.frame}
                  size={44}
                />

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{displayName(entry)}</p>
                  {entry.ingameName && (
                    <p className="text-xs text-[var(--zps-text-secondary)] truncate">
                      {entry.email.split("@")[0]}
                    </p>
                  )}
                </div>

                {/* Flower count */}
                <div className="text-right shrink-0">
                  <p className="font-bold text-[var(--zps-brand-orange)]">
                    {entry.totalFlowers}
                  </p>
                  <p className="text-xs text-[var(--zps-text-secondary)]">loại hoa</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <PlayerModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
    </>
  );
}

export type { LeaderboardEntry };
```

- [ ] **Step 2: Verify TypeScript compile**

```bash
npx tsc --noEmit
```

Expected: no errors (có thể có warning về PlayerDetail.frame chưa match PlayerModal — fix ở Task 7).

- [ ] **Step 3: Commit**

```bash
git add src/components/LeaderboardClient.tsx
git commit -m "feat: use PlayerAvatar in LeaderboardClient"
```

---

## Task 7: Cập nhật `PlayerModal`

**Files:**
- Modify: `src/components/PlayerModal.tsx`

- [ ] **Step 1: Thêm `frame` vào PlayerDetail interface và dùng PlayerAvatar**

Trong `src/components/PlayerModal.tsx`:

1. Thêm import `PlayerAvatar`:
```tsx
import { PlayerAvatar } from "@/components/PlayerAvatar";
```

2. Thêm `frame: string | null` vào `PlayerDetail` interface:
```ts
interface PlayerDetail {
  id: string;
  name: string | null;
  ingameName: string | null;
  image: string | null;
  frame: string | null;   // ← thêm
  bio: string | null;
  gameId: string | null;
  totalFlowers: number;
  topFlowers: TopFlower[];
}
```

3. Thay thế block avatar trong header (khoảng line 81-96) bằng:
```tsx
<PlayerAvatar
  image={player.image}
  name={displayName}
  frame={player.frame}
  size={72}
/>
```

- [ ] **Step 2: Verify TypeScript compile**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/PlayerModal.tsx
git commit -m "feat: use PlayerAvatar in PlayerModal"
```

---

## Task 8: Cập nhật `StatsClient` + `stats/page.tsx`

**Files:**
- Modify: `src/components/StatsClient.tsx`
- Modify: `src/app/stats/page.tsx`

- [ ] **Step 1: Cập nhật `stats/page.tsx` để fetch frame data**

Thay toàn bộ nội dung `src/app/stats/page.tsx`:

```tsx
import type { Metadata } from "next";
import { requireMember } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { StatsClient } from "@/components/StatsClient";
import { sortFlowersByQuality } from "@/lib/sort";
import { getAvailableFrames } from "@/app/actions/profile";

export const metadata: Metadata = {
  title: "Hoa của tôi — Thành Hội: LIMITED",
};

export default async function StatsPage() {
  const session = await requireMember();

  const [user, flowers, ownerships, availableFrames] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        image: true,
        ingameName: true,
        bio: true,
        gameId: true,
        zalo: true,
        frame: true,
      },
    }),
    prisma.flowerType.findMany({ orderBy: { name: "asc" } }),
    prisma.flowerOwnership.findMany({
      where: { userId: session.user.id },
      select: { flowerTypeId: true },
    }),
    getAvailableFrames(),
  ]);

  const ownedIds = ownerships.map((o) => o.flowerTypeId);

  return (
    <StatsClient
      user={user}
      flowers={sortFlowersByQuality(flowers)}
      ownedFlowerIds={ownedIds}
      availableFrames={availableFrames}
    />
  );
}
```

- [ ] **Step 2: Cập nhật `StatsClient` — thêm FramePicker + frame state**

Trong `src/components/StatsClient.tsx`:

1. Thêm imports:
```tsx
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { FramePicker } from "@/components/FramePicker";
```

2. Cập nhật `UserProfile` interface (thêm `frame`):
```ts
interface UserProfile {
  name: string | null;
  email: string | null;
  image: string | null;
  ingameName: string | null;
  bio: string | null;
  gameId: string | null;
  zalo: string | null;
  frame: string | null;  // ← thêm
}
```

3. Cập nhật `Props` interface:
```ts
interface Props {
  user: UserProfile | null;
  flowers: Flower[];
  ownedFlowerIds: string[];
  availableFrames: string[];  // ← thêm
}
```

4. Cập nhật function signature:
```ts
export function StatsClient({ user, flowers, ownedFlowerIds, availableFrames }: Props) {
```

5. Thêm state `currentFrame` sau các state hiện có:
```ts
const [currentFrame, setCurrentFrame] = useState<string | null>(user?.frame ?? null);
```

6. Thêm function `saveFrame` sau `saveProfile`:
```ts
function saveFrame(frame: string | null) {
  setCurrentFrame(frame);
  startTransition(async () => {
    try {
      await updateMyProfile({ frame });
      showToast("Đã cập nhật khung! ✨", true);
    } catch {
      showToast("Lưu thất bại, thử lại nhé!", false);
      setCurrentFrame(user?.frame ?? null);
    }
  });
}
```

7. Thay thế block avatar trong StatsClient (khoảng line 91-108) bằng:
```tsx
<div className="flex flex-col items-center gap-3 pb-4 border-b border-white/10">
  <PlayerAvatar
    image={user?.image ?? null}
    name={displayName}
    frame={currentFrame}
    size={80}
  />
  <div className="text-center">
    <p className="font-semibold">{displayName}</p>
    <p className="text-xs text-[var(--zps-text-secondary)]">{user?.email}</p>
  </div>
</div>
```

8. Thêm `<FramePicker>` bên dưới block avatar (trước `{/* Form fields */}`):
```tsx
{/* Frame picker */}
{availableFrames.length > 0 && (
  <FramePicker
    availableFrames={availableFrames}
    currentFrame={currentFrame}
    userImage={user?.image ?? null}
    userName={displayName}
    onSelect={saveFrame}
    disabled={isPending}
  />
)}
```

- [ ] **Step 3: Verify TypeScript compile**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Chạy unit tests**

```bash
npm test
```

Expected: `18 passed` (13 sort tests + 5 frame validation tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/stats/page.tsx src/components/StatsClient.tsx
git commit -m "feat: add frame picker to stats profile panel"
```

---

## Task 9: Smoke test trên browser

**Files:** Không có thay đổi code.

- [ ] **Step 1: Chạy dev server (nếu chưa chạy)**

```bash
npm run dev
```

- [ ] **Step 2: Kiểm tra home page — leaderboard**

Mở `http://localhost:3000` và kiểm tra:
- Avatar các thành viên hiển thị dạng vuông bo góc (border-radius ~12px)
- Không có khung (vì chưa ai chọn) — bình thường

- [ ] **Step 3: Kiểm tra stats page — frame picker**

Đăng nhập và mở `http://localhost:3000/stats`:
- Avatar trong panel trái hiển thị vuông bo góc
- Phần "Khung avatar" hiển thị grid các frame
- Click một frame → avatar cập nhật ngay (optimistic)
- Toast "Đã cập nhật khung! ✨" xuất hiện
- Reload page → frame được giữ nguyên

- [ ] **Step 4: Kiểm tra PlayerModal**

Từ home page, click vào một thành viên:
- Modal hiển thị avatar 72px vuông bo góc
- Nếu thành viên đó đã chọn frame → frame hiển thị chồng lên
