# Mobile Responsive Design — Thành Hội: LIMITED

**Ngày:** 2026-04-17  
**Scope:** Responsive layout cho màn hình mobile (~375px–640px)  
**Approach:** Tailwind breakpoint classes thuần — không tạo component mới

---

## Tóm tắt quyết định

| Phần | Quyết định |
|------|-----------|
| Navigation | Compact inline — icon only trên mobile, full text từ `sm:` |
| Stats `/stats` | 2 Tab trên mobile (Hoa / Hồ sơ), 2 cột desktop giữ nguyên |
| FlowerGrid | `grid-cols-4` mobile → `sm:grid-cols-5` → `md:grid-cols-6` → `lg:grid-cols-7` |
| PlayerModal top hoa | Giữ `grid-cols-5`, thu nhỏ ảnh `w-10 h-10 sm:w-16 sm:h-16` |
| AdminClient bảng | Card list mobile (`block sm:hidden`) + bảng desktop (`hidden sm:block`) |

---

## Section 1: Navigation (`Navigation.tsx`)

**Vấn đề:** 4 element ngang (logo + links + ThemeToggle + avatar) chật trên <400px.

**Thay đổi:**
- Logo: `<span class="hidden sm:inline">Thành Hội: </span>LIMITED` — mobile chỉ hiện `🌸 LIMITED`
- Nav links dùng icon + hidden text:
  - Bảng xếp hạng → `🏆<span class="hidden sm:inline"> Bảng xếp hạng</span>`
  - Hoa của tôi → `🌸<span class="hidden sm:inline"> Hoa của tôi</span>`
  - Quản trị → `⚙️<span class="hidden sm:inline"> Quản trị</span>`
- ThemeToggle và Avatar: giữ nguyên, không đổi
- Breakpoint: `sm` = 640px

**Kết quả ~375px:** `🌸 LIMITED · 🏆 · 🌸 · ⚙️ · 🌙 · [avatar]` — vừa 1 hàng.

---

## Section 2: StatsClient (`StatsClient.tsx`)

**Vấn đề:** Stack dọc trên mobile đặt Profile form trước Flower Grid, phải scroll để chọn hoa.

**Thay đổi:**
- Thêm state: `const [activeTab, setActiveTab] = useState<"flowers" | "profile">("flowers")`
- Tab bar chỉ hiện mobile: `<div class="flex lg:hidden gap-2 mb-3">`
  - Tab "🌸 Hoa của tôi" và "👤 Hồ sơ"
  - Active tab: style `bg-[var(--zps-bg-elevated)]` + `text-[var(--zps-text-primary)]`
- Mỗi section wrap trong (mobile: tab điều khiển, desktop: `lg:block` override `hidden`):
  - Profile: `className={${activeTab === "profile" ? "block" : "hidden"} lg:block}`
  - Flowers: `className={${activeTab === "flowers" ? "block" : "hidden"} lg:block lg:col-span-2}`
- Desktop `lg:grid-cols-3`: giữ nguyên hoàn toàn
- Default tab: `"flowers"` (chức năng chính)

---

## Section 3: FlowerGrid (`FlowerGrid.tsx`)

**Vấn đề:** Grid cũ bắt đầu từ `grid-cols-4` nhưng chưa tối ưu cho 375px.

**Thay đổi:**
- Sửa grid className: `grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7`
- Tên hoa: `text-[10px] sm:text-xs` — đủ đọc trên mobile
- Tên hoa dài (VD: "Gia nguyệt - neo thuyền vượt gió"): thêm `line-clamp-2 break-words` để wrap tối đa 2 dòng thay vì tràn ra ngoài card
- Filter bar và "Chọn tất cả": giữ nguyên behavior, `flex-wrap` đã tự xử lý
- Ảnh hoa: `aspect-square w-full` tự co theo cột — không cần đổi

---

## Section 4: PlayerModal (`PlayerModal.tsx`)

**Vấn đề:** Hardcode `width={80} height={80}` và modal không có max-width responsive.

**Thay đổi:**
- Modal container: thêm `w-[95vw] sm:w-auto max-h-[85vh] overflow-y-auto`
- Padding: `p-4 sm:p-6`
- Thumbnail top hoa: đổi từ `width={80} height={80}` → className `w-10 h-10 sm:w-16 sm:h-16`
- `grid-cols-5` cho top hoa: giữ nguyên ở mọi breakpoint

---

## Section 5: AdminClient (`AdminClient.tsx`)

**Vấn đề:** Bảng nhiều cột không hiển thị được trên mobile.

**Thay đổi quyền truy cập:**
- Trang `/admin` mở cho **tất cả mọi người** xem (bỏ `requireAdmin` guard ở layout)
- Các nút Thêm / Sửa / Xóa / Duyệt chỉ render khi `user.role === "ADMIN"` — dùng conditional render
- Người dùng thường thấy dữ liệu read-only, không thấy action buttons

**Pattern chung cho cả 3 tab:**

```tsx
{/* Desktop: bảng */}
<div className="hidden sm:block overflow-x-auto">
  <table>...</table>
</div>

{/* Mobile: card list */}
<div className="block sm:hidden space-y-2">
  {items.map(item => (
    <div className="card-gradient flex items-center gap-3 p-3">
      ...
    </div>
  ))}
</div>
```

**Tab Catalog hoa (mobile card):** `[ảnh 40px] [Tên · Phẩm chất màu · X người sở hữu] [Sửa | Xóa — chỉ admin]`

**Click vào hoa → FlowerOwnersModal:**
- Áp dụng cả desktop lẫn mobile, cả admin lẫn member thường
- Hiển thị modal với tiêu đề tên hoa + phẩm chất
- Danh sách thành viên đang sở hữu: `[avatar 32px] [ingameName hoặc name] [email phụ nhỏ]`
- Nếu chưa có ai: text `"Chưa có ai sở hữu hoa này 🌱"`
- Data: query `FlowerOwnership` join `User` theo `flowerTypeId` — thêm server action `getFlowerOwners(flowerTypeId)`
- Desktop: click vào row bảng hoặc card mobile đều mở modal

**Tab Thành viên (mobile card):** `[avatar 36px] [Tên · email · role badge] [Duyệt? | Xóa — chỉ admin]`  
- User chưa approved: highlight border cam nổi bật (chỉ admin thấy nút Duyệt)

**Tab Mùa giải (mobile card):** `[Mùa X] [Tier · Hạng #N · Điểm] [Sửa | Xóa — chỉ admin]`

---

## Files thay đổi

| File | Loại thay đổi |
|------|--------------|
| `src/components/Navigation.tsx` | Thêm `hidden sm:inline` cho text labels |
| `src/components/StatsClient.tsx` | Thêm tab state + tab bar mobile |
| `src/components/FlowerGrid.tsx` | Sửa grid-cols + text size |
| `src/components/PlayerModal.tsx` | Sửa modal size + thumbnail size |
| `src/components/AdminClient.tsx` | Thêm card list mobile + ẩn action buttons với non-admin |
| `src/app/admin/layout.tsx` | Bỏ `requireAdmin` guard, truyền `user.role` xuống client |
| `src/components/FlowerOwnersModal.tsx` | Component mới — modal danh sách thành viên sở hữu hoa |
| `src/app/actions/flower-types.ts` | Thêm server action `getFlowerOwners(flowerTypeId)` |

**Không thay đổi:** server actions khác (vẫn check quyền server-side), data flow, desktop layout, animations.

---

## Breakpoints tham chiếu

| Breakpoint | Min-width | Dùng cho |
|-----------|-----------|----------|
| (default) | 0px | Mobile ~375px |
| `sm:` | 640px | Tablet nhỏ trở lên |
| `lg:` | 1024px | Desktop (2-col layout stats) |
