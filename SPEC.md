# Thành Hội: LIMITED — Spec v1

Ứng dụng web quản lý thành viên và xếp hạng bộ sưu tập hoa cho công hội mobile game chủ đề hoa.

---

## 1. Mục tiêu & Phạm vi

### Mục tiêu

- Hiển thị bảng xếp hạng thành viên theo số hoa sở hữu.
- Cho thành viên tự cập nhật danh sách hoa đang sở hữu (từ ~300 loại).
- Admin quản lý thành viên & catalog hoa trong game.

### Non-goals (v1 không làm)

- Chat, thông báo realtime, bình luận.
- Lịch sử giao dịch / tracking thay đổi theo thời gian.
- Mobile app native.
- Multi-guild (chỉ 1 hội duy nhất).
- Export/import CSV.
- i18n (chỉ tiếng Việt).

### Quy mô

- 20–100 thành viên.
- ~300 loại hoa trong catalog.
- Traffic thấp, 1 hội duy nhất.

---

## 2. User roles & Auth flow

### Roles

| Role       | Quyền                                                             |
| ---------- | ----------------------------------------------------------------- |
| **GUEST**  | Xem dashboard (BXH, top 3, chi tiết người chơi). KHÔNG đăng nhập. |
| **MEMBER** | Mọi quyền của Guest + chỉnh sửa profile & hoa sở hữu của chính mình. |
| **ADMIN**  | Mọi quyền của Member + thêm/sửa/xóa loại hoa, đặt role thành viên khác, xóa thành viên. |

### Auth

- Dùng **NextAuth v5 (Auth.js)** + **Google Provider** duy nhất.
- User mới đăng nhập lần đầu → auto tạo record với role `MEMBER`.
- Admin đầu tiên: seed bằng email cấu hình trong `ADMIN_EMAILS` env var (list phân tách bằng dấu phẩy).
- Session: JWT strategy, 30 ngày.

### Bảo vệ route

- Middleware chặn `/stats`, `/admin` khi chưa đăng nhập → redirect `/sign-in`.
- `/admin/**` kiểm tra role `ADMIN` ở server (layout) → `forbidden()` nếu không phải admin.

---

## 3. Data model

### ERD

```
User ──< FlowerOwnership >── FlowerType
User ──< Account (NextAuth)
User ──< Session (NextAuth)
```

### Prisma schema (tóm tắt)

```prisma
enum Role {
  MEMBER
  ADMIN
}

enum Quality {
  DO        // Đỏ
  CAM       // Cam
  TIM       // Tím
  XANH_LAC  // Xanh lá
  XANH_LAM  // Xanh dương
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?           // tên Google
  image         String?           // avatar Google
  // Profile in-game
  ingameName    String?           // Tên trong game
  bio           String?           // Tiểu sử
  gameId        String?           // ID trò chơi
  zalo          String?           // Zalo (optional)
  role          Role     @default(MEMBER)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  accounts      Account[]
  sessions      Session[]
  ownerships    FlowerOwnership[]
}

model FlowerType {
  id          String   @id @default(cuid())
  name        String                  // VD "Hoa hồng"
  quality     Quality
  imageUrl    String?                 // ảnh hoa do admin upload/paste URL
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  ownerships  FlowerOwnership[]

  @@unique([name, quality])           // cùng tên + cùng phẩm chất là duplicate
  @@index([quality])
}

model FlowerOwnership {
  id            String     @id @default(cuid())
  userId        String
  flowerTypeId  String
  createdAt     DateTime   @default(now())

  user          User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  flowerType    FlowerType @relation(fields: [flowerTypeId], references: [id], onDelete: Cascade)

  @@unique([userId, flowerTypeId])   // mỗi user chỉ sở hữu 1 lần 1 loại
  @@index([userId])
  @@index([flowerTypeId])
}

// + Account, Session, VerificationToken của NextAuth
```

### Quyết định thiết kế

- **Ownership là quan hệ boolean** (tồn tại record = sở hữu). Không lưu `count` — theo làm rõ của Anh: "Hoa sở hữu ở đây là các hoa có trong game. VD có Hoa hồng, hoa cúc đỏ, hoa cúc trắng. ko phải là số lượng mỗi hoa bao nhiêu".
- **Tổng hoa** của user = `COUNT(FlowerOwnership WHERE userId = ?)`.
- **Phẩm chất nằm trên FlowerType**, không nằm trên ownership (1 hoa = 1 tên + 1 phẩm chất cố định trong game).
- **Xóa user** → cascade xóa ownerships.

---

## 4. Screens & Routes

| Route         | Auth      | Mục đích                                                                              |
| ------------- | --------- | ------------------------------------------------------------------------------------- |
| `/`           | Public    | Dashboard: 3 stats card + Top 10 BXH. Click row/card → modal chi tiết người chơi.    |
| `/sign-in`    | Public    | Nút Sign in with Google.                                                              |
| `/stats`      | Member+   | Form cập nhật profile (tên, bio, gameId, zalo) + grid chọn hoa sở hữu (filter, search, select all theo filter). |
| `/admin`      | Admin     | Quản lý catalog hoa + danh sách thành viên (đổi role, xóa).                          |
| `/api/auth/*` | —         | NextAuth handlers.                                                                    |

### Dashboard `/`

- **3 stats card**: Tổng thành viên / Mùa hiện tại / Thành viên hạng #1 (clickable → modal).
- **Bảng Top 10**: rank badge, avatar, tên ingame, handle, tổng hoa. Row clickable → modal.
- **Modal chi tiết người chơi**: avatar, tên, bio, tổng hoa, **Top 10 hoa phẩm chất cao nhất** (5/row, 80x80px thumbnail).

### `/stats`

- Bên trái: profile form (avatar hiển thị, 4 field text).
- Bên phải: flower grid ~300 card. Search + filter 5 phẩm chất + "Chọn tất cả/Xóa tất cả" (**chỉ áp dụng trên filter đang chọn** — theo feedback của Anh).
- Nút "Lưu thông tin" ở cuối → Server Action.

### `/admin`

- Tab **Catalog hoa**: danh sách `FlowerType` + nút "Thêm loại hoa" (modal: tên, phẩm chất, image URL).
- Tab **Thành viên**: bảng user với action đổi role, xóa.

### `/sign-in`

- 1 nút Google, logo, slogan.

---

## 5. API contracts

Ưu tiên **Server Components** + **Server Actions**. Route Handlers chỉ dùng cho NextAuth.

### Server Actions (file `src/app/actions/*.ts` với `"use server"`)

| Action                                 | Input                                                               | Quyền   | Tác động                                                     |
| -------------------------------------- | ------------------------------------------------------------------- | ------- | ------------------------------------------------------------ |
| `updateMyProfile(data)`                | `{ ingameName, bio, gameId, zalo }`                                 | Member  | Update `User` của session hiện tại.                          |
| `updateMyOwnerships(flowerTypeIds)`    | `string[]`                                                          | Member  | Replace toàn bộ ownership của user hiện tại.                 |
| `createFlowerType(data)`               | `{ name, quality, imageUrl? }`                                      | Admin   | Tạo `FlowerType` mới.                                        |
| `updateFlowerType(id, data)`           | same as create                                                      | Admin   | Update.                                                      |
| `deleteFlowerType(id)`                 | `string`                                                            | Admin   | Xóa (cascade ownerships).                                    |
| `updateUserRole(userId, role)`         | `{ userId, role: 'MEMBER' \| 'ADMIN' }`                             | Admin   | Đổi role. Không đổi role của chính mình (tránh tự khóa).     |
| `deleteUser(userId)`                   | `string`                                                            | Admin   | Xóa user.                                                    |

Mọi action: validate bằng Zod, check session + role ở server, `revalidatePath` sau khi mutate.

### Data fetching (Server Components)

- `getLeaderboard(limit = 10)`: join User + count ownerships, sort desc theo count.
- `getUserDetail(userId)`: user + ownerships (join flowerType), sort theo qualityOrder rồi lấy top 10.
- `getFlowerCatalog()`: tất cả FlowerType.
- `getMyOwnerships()`: ownerships của session user.
- `getAllUsers()`: (admin) danh sách users + count ownerships.

---

## 6. Business rules

- **Sort BXH**: `COUNT(ownerships)` DESC, rồi theo `createdAt` ASC (ai vào sớm hơn xếp trước khi bằng điểm).
- **Thứ tự phẩm chất** (cao → thấp, dùng sort "top hoa phẩm cao nhất"): `DO(1) → CAM(2) → TIM(3) → XANH_LAC(4) → XANH_LAM(5)`.
- **Unique constraint** trên `FlowerType(name, quality)` → tránh admin tạo trùng.
- **Tên ingame không bắt buộc nhập ngay** — user mới login vẫn vào được, nhưng hiển thị trên BXH sẽ fallback sang `name` Google.
- **Delete FlowerType** → cascade xóa ownerships liên quan (mọi user mất hoa đó). Cần confirm dialog ở admin.

---

## 7. Tech stack & Folder structure

### Stack

- **Next.js 15** App Router + React 19
- **TypeScript** strict
- **Tailwind CSS 3** + CSS variables cho ZPS tokens
- **Prisma 6** + SQLite (file `./prisma/dev.db`)
- **NextAuth v5 (Auth.js)** + `@auth/prisma-adapter` + Google provider
- **Framer Motion 11** cho animations
- **Zod** cho validation
- **Font**: Be Vietnam Pro qua `next/font/google`

### Folder structure

```
E:/workspace/Limited/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                       # tạo admin đầu tiên + catalog hoa mẫu
├── src/
│   ├── app/
│   │   ├── layout.tsx                # html, font, aurora bg, petal layer
│   │   ├── page.tsx                  # dashboard (server component)
│   │   ├── globals.css               # ZPS tokens + animations
│   │   ├── sign-in/page.tsx
│   │   ├── stats/page.tsx            # protected, member+
│   │   ├── admin/
│   │   │   ├── layout.tsx            # role check
│   │   │   ├── page.tsx              # tabs
│   │   │   └── ...
│   │   ├── actions/
│   │   │   ├── profile.ts
│   │   │   ├── ownerships.ts
│   │   │   ├── flower-types.ts
│   │   │   └── admin.ts
│   │   └── api/auth/[...nextauth]/route.ts
│   ├── components/
│   │   ├── Navigation.tsx            # client, nav menu
│   │   ├── AuroraBg.tsx              # ambient gradient
│   │   ├── PetalLayer.tsx            # falling petals (client)
│   │   ├── Sparkles.tsx
│   │   ├── Leaderboard.tsx           # server
│   │   ├── LeaderboardRow.tsx        # client, onClick → modal
│   │   ├── PlayerModal.tsx           # client, framer-motion
│   │   ├── FlowerGrid.tsx            # client, filter/search/select
│   │   ├── FlowerCard.tsx            # client
│   │   ├── AddFlowerTypeModal.tsx
│   │   └── ui/                       # primitives (Button, Input, Modal)
│   ├── lib/
│   │   ├── prisma.ts                 # singleton
│   │   ├── auth.ts                   # NextAuth config
│   │   ├── auth-helpers.ts           # requireMember, requireAdmin
│   │   └── sort.ts                   # qualityOrder, sortFlowersByQuality
│   ├── types/
│   │   └── index.ts
│   └── middleware.ts                 # route protection
├── .env.example
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── SPEC.md (file này)
```

---

## 8. Env vars

```bash
# .env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="<openssl rand -base64 32>"
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."
ADMIN_EMAILS="khaclinh@example.com"     # list phân tách bằng dấu phẩy — tự động promote role ADMIN khi login
```

---

## 9. Kế hoạch thực thi (sau khi Anh duyệt spec)

1. **Setup**: package.json, tsconfig, tailwind, next config, Prisma schema → `prisma db push`.
2. **Auth**: NextAuth config, sign-in page, middleware protection.
3. **Seed**: catalog hoa mẫu (32 hoa từ mockup) + promote admin theo `ADMIN_EMAILS`.
4. **Layout + Nav + AuroraBg + PetalLayer** (port từ mockup).
5. **Dashboard `/`**: server component fetch leaderboard + PlayerModal.
6. **`/stats`**: profile form + flower grid + server actions.
7. **`/admin`**: catalog management + member management.
8. **QA**: chạy `next dev`, test flow Guest / Member / Admin.

---

## 10. Quyết định cuối (đã chốt với Anh)

1. **Ảnh hoa**: admin paste URL. Không upload file ở v1.
2. **Xóa user**: hard-delete (cascade ownerships).
3. **Seed catalog**: dùng 32 hoa mẫu trong mockup làm khởi đầu. Admin sẽ add dần ~250 hoa còn lại qua UI `/admin`.
4. **Đăng xuất**: dropdown avatar góc phải nav (hover/click hiển thị email + nút "Đăng xuất").
