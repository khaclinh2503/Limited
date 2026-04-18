# Avatar + Frame Design Spec

## Goal

Hiển thị avatar Google của thành viên dạng vuông bo góc, với khung (frame) PNG trang trí chồng lên. Thành viên tự chọn khung trong trang Stats.

## Architecture

### DB Change
Thêm field vào `User` model trong `prisma/schema.prisma`:
```prisma
frame String? // path ảnh khung, ví dụ: "/frame/1.png", null = không có khung
```

Chạy `npm run db:push` sau khi cập nhật schema.

### Component mới: `PlayerAvatar`

File: `src/components/PlayerAvatar.tsx`

Props:
```ts
interface PlayerAvatarProps {
  image: string | null      // Google profile image URL
  name: string              // display name (dùng cho alt + fallback initial)
  frame: string | null      // path khung, ví dụ "/frame/1.png" hoặc null
  size: number              // kích thước avatar (px), ví dụ 44, 52, 72, 80
}
```

Layout:
- Container: `position: relative`, `width: size`, `height: size`, `flex-shrink: 0`
- Google avatar: `next/image`, `border-radius: 14px`, `object-fit: cover`, `object-position: top`, fill container
- Fallback (không có ảnh Google): div gradient với initial chữ cái
- Frame overlay: `<img>` `position: absolute`, kích thước `size * 1.4`, offset `-size * 0.2` (top + left), `object-fit: contain`, `z-index: 10`, pointer-events none
- Container phải `overflow: visible` để frame tràn ra ngoài

### Server Action Update

File: `src/app/actions/profile.ts`

Thêm `frame` vào `ProfileSchema`:
```ts
frame: z.string().regex(/^\/frame\/\d+\.png$/).nullable().optional()
```

Thêm `frame` vào `prisma.user.update`.

### Frame Picker Component

File: `src/components/FramePicker.tsx`

- Client component (`"use client"`)
- Props: `currentFrame: string | null`, `onSelect: (frame: string | null) => void`
- Đọc danh sách frame từ prop (truyền từ server, không `readdir` ở client)
- Grid 6 cột, mỗi ô: mini `PlayerAvatar` (size=48) với frame preview
- Ô đầu tiên: không khung (frame=null), border dashed
- Ô đang chọn: border cam `#f97316` + glow nhẹ
- Click → gọi `onSelect(frameUrl)`

### Server: Đọc danh sách frame

File: `src/app/actions/profile.ts` (thêm action mới):
```ts
export async function getAvailableFrames(): Promise<string[]>
```
Dùng `readdir("public/frame")` → filter `.png` → sort numeric (1, 2, 3... không phải lexicographic 1, 10, 11) → trả về array dạng `["/frame/1.png", "/frame/2.png", ...]`.

### StatsClient Update

File: `src/components/StatsClient.tsx`

- Nhận thêm props: `availableFrames: string[]`, `currentFrame: string | null`
- Render `<FramePicker>` trong section profile
- Khi user chọn frame: gọi `updateMyProfile({ frame })` + `useOptimistic` để update UI ngay

### Components cập nhật dùng PlayerAvatar

| Component | Size | Thay thế |
|-----------|------|---------|
| `LeaderboardClient.tsx` | 44px (list) + 52px (rank-1 card) | Thay `<Image>` + fallback div |
| `PlayerModal.tsx` | 80px | Thay `<Image>` + fallback div |

Tất cả đều nhận thêm `frame: string | null` từ data.

### Data Flow

1. `getLeaderboard()` trong `queries.ts` — thêm `frame: true` vào `select`
2. `getPlayerDetail()` trong `queries.ts` — thêm `frame: true` vào `select`
3. `LeaderboardEntry` type — thêm `frame: string | null`
4. `PlayerDetail` type — thêm `frame: string | null`
5. Stats page server component — gọi `getAvailableFrames()`, truyền xuống `StatsClient`

## Frame Overlay CSS

```css
/* Container */
position: relative;
width: {size}px;
height: {size}px;
flex-shrink: 0;

/* Google avatar / fallback */
border-radius: 14px;
overflow: hidden; /* clip avatar, không clip frame */

/* Frame overlay */
position: absolute;
top: -{size * 0.2}px;
left: -{size * 0.2}px;
width: {size * 1.4}px;
height: {size * 1.4}px;
object-fit: contain;
pointer-events: none;
z-index: 10;
```

**Lưu ý quan trọng:** Cần tách 2 lớp:
- Div ngoài (`av-outer`): `position: relative`, `overflow: visible` — frame tràn ra được
- Div trong (`av-inner`): `overflow: hidden`, `border-radius: 14px` — clip avatar Google theo bo góc
- Frame `<img>`: nằm trong `av-outer`, không bị clip bởi `av-inner`

## File Changes Summary

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Thêm field `frame String?` vào User |
| `src/components/PlayerAvatar.tsx` | Tạo mới |
| `src/components/FramePicker.tsx` | Tạo mới |
| `src/app/actions/profile.ts` | Thêm `frame` vào schema + action + `getAvailableFrames` |
| `src/lib/queries.ts` | Thêm `frame` vào select của `getLeaderboard` và `getPlayerDetail` |
| `src/types/index.ts` | Thêm `frame` vào types |
| `src/components/LeaderboardClient.tsx` | Dùng `PlayerAvatar` |
| `src/components/PlayerModal.tsx` | Dùng `PlayerAvatar` |
| `src/components/StatsClient.tsx` | Thêm `FramePicker` |
| `src/app/stats/page.tsx` | Truyền `availableFrames` + `currentFrame` xuống StatsClient |
