"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { qualityColor, qualityLabel, qualityBgGradient } from "@/lib/sort";
import {
  createFlowerType,
  updateFlowerType,
  deleteFlowerType,
  getUnmappedFlowerImages,
} from "@/app/actions/flower-types";
import { approveUser, updateUserRole, deleteUser } from "@/app/actions/admin";
import { upsertSeasonResult, deleteSeasonResult } from "@/app/actions/seasons";
import type { Quality, Role } from "@prisma/client";
import { FlowerOwnersModal } from "@/components/FlowerOwnersModal";

/* ── Types ── */
interface Flower {
  id: string;
  name: string;
  quality: Quality;
  imageUrl: string | null;
  _count: { ownerships: number };
}

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  ingameName: string | null;
  role: Role;
  approved: boolean;
  createdAt: Date;
  _count: { ownerships: number };
  ownerships: { flowerTypeId: string }[];
}

interface SeasonResult {
  id: string;
  season: number;
  tier: string;
  rank: number;
  points: number;
}

interface Props {
  flowers: Flower[];
  users: User[];
  seasons: SeasonResult[];
  isAdmin: boolean;
}

/* ── Flower modal form ── */
interface FlowerForm {
  name: string;
  quality: Quality;
  imageUrl: string;
}

const EMPTY_FORM: FlowerForm = { name: "", quality: "DO", imageUrl: "" };

/* ── Main component ── */
/* ── Quality tabs (shared) ── */
const QUALITY_TABS: (Quality | "ALL")[] = ["ALL", "DO", "CAM", "TIM", "XANH_LAM", "XANH_LAC"];
const QUALITY_TAB_LABEL: Record<Quality | "ALL", string> = {
  ALL: "Tất cả", DO: "Đỏ", CAM: "Cam", TIM: "Tím", XANH_LAC: "Xanh lá", XANH_LAM: "Xanh lam",
};

export function AdminClient({ flowers, users, seasons, isAdmin }: Props) {
  const [tab, setTab] = useState<"flowers" | "members" | "seasons">("flowers");

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold">Quản trị</h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 border-b border-white/10 shrink-0">
        {[
          { key: "flowers",  label: "🌸 Catalog hoa", count: flowers.length, pending: 0 },
          { key: "members",  label: "👥 Thành viên",  count: users.length,   pending: users.filter(u => !u.approved).length },
          { key: "seasons",  label: "🏆 Mùa giải",    count: seasons.length, pending: 0 },
        ].map(({ key, label, count, pending }) => (
          <button
            key={key}
            onClick={() => setTab(key as "flowers" | "members" | "seasons")}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all -mb-px border-b-2 ${
              tab === key
                ? "border-[var(--zps-brand-orange)] text-[var(--zps-text-primary)] bg-[var(--zps-bg-surface)]"
                : "border-transparent text-[var(--zps-text-secondary)] hover:text-[var(--zps-text-primary)]"
            }`}
          >
            {label}
            <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-white/10">
              {count}
            </span>
            {pending > 0 && (
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: "#E8341A", color: "#fff" }}>
                {pending}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        {tab === "flowers" ? (
          <FlowerCatalogTab flowers={flowers} isAdmin={isAdmin} />
        ) : tab === "members" ? (
          <MembersTab users={users} flowers={flowers} isAdmin={isAdmin} />
        ) : (
          <SeasonsTab seasons={seasons} isAdmin={isAdmin} />
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Tab Catalog Hoa
══════════════════════════════════════════ */
function FlowerCatalogTab({ flowers, isAdmin }: { flowers: Flower[]; isAdmin: boolean }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Flower | null>(null);
  const [form, setForm] = useState<FlowerForm>(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<Flower | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [flowerOwnersTarget, setFlowerOwnersTarget] = useState<Flower | null>(null);
  const [qualityFilter, setQualityFilter] = useState<Quality | "ALL">("ALL");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [unmappedImages, setUnmappedImages] = useState<string[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setModalOpen(true);
  }

  function openEdit(f: Flower) {
    setEditing(f);
    setForm({ name: f.name, quality: f.quality, imageUrl: f.imageUrl ?? "" });
    setError("");
    setModalOpen(true);
  }

  function submit() {
    if (!form.name.trim()) { setError("Tên không được trống"); return; }
    setError("");
    startTransition(async () => {
      try {
        if (editing) {
          await updateFlowerType(editing.id, form);
        } else {
          await createFlowerType(form);
        }
        setModalOpen(false);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Lỗi không xác định");
      }
    });
  }

  async function openPicker() {
    setPickerLoading(true);
    setPickerOpen(true);
    const images = await getUnmappedFlowerImages();
    setUnmappedImages(images);
    setPickerLoading(false);
  }

  function confirmAndDelete(f: Flower) {
    startTransition(async () => {
      await deleteFlowerType(f.id);
      setConfirmDelete(null);
    });
  }

  const filtered = flowers.filter((f) => {
    const matchQ = qualityFilter === "ALL" || f.quality === qualityFilter;
    const matchS = f.name.toLowerCase().includes(search.toLowerCase());
    return matchQ && matchS;
  });

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Filter bar */}
      <div className="card-gradient space-y-3 shrink-0">
        <div className="flex gap-3 items-center">
          <input
            type="text"
            className="input-field flex-1"
            placeholder="🔍 Tìm kiếm hoa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {isAdmin && (
            <button onClick={openAdd} className="btn-primary py-2 px-4 text-sm rounded-lg shrink-0">
              + Thêm loại hoa
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {QUALITY_TABS.map((q) => {
            const active = qualityFilter === q;
            const color = q !== "ALL" ? qualityColor[q] : undefined;
            return (
              <button
                key={q}
                onClick={() => setQualityFilter(q)}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150"
                style={
                  active
                    ? { background: color ?? "linear-gradient(135deg,#E8341A,#F5A623)", color: "#fff", boxShadow: color ? `0 0 12px ${color}55` : undefined }
                    : { background: "var(--zps-bg-elevated)", color: color ?? "var(--zps-text-secondary)", border: `1px solid ${color ?? "rgba(255,255,255,0.1)"}` }
                }
              >
                {QUALITY_TAB_LABEL[q]}
                {q !== "ALL" && (
                  <span className="ml-1.5 text-xs opacity-70">
                    ({flowers.filter((f) => f.quality === q).length})
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-white/10">
          <p className="text-sm text-[var(--zps-text-secondary)]">
            <span className="font-bold text-white">{filtered.length}</span> / {flowers.length} loại hoa
          </p>
          {(search || qualityFilter !== "ALL") && (
            <button
              className="text-xs text-[var(--zps-text-secondary)] hover:text-white transition-colors"
              onClick={() => { setSearch(""); setQualityFilter("ALL"); }}
            >
              ✕ Xóa filter
            </button>
          )}
        </div>
      </div>

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
                    style={{ background: qualityBgGradient(f.quality), border: `2px solid ${color}` }}
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
                    style={{ background: qualityBgGradient(f.quality), border: `2px solid ${color}` }}
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

      <FlowerOwnersModal
        flower={flowerOwnersTarget}
        onClose={() => setFlowerOwnersTarget(null)}
      />

      {/* Add/Edit modal */}
      {modalOpen && (
        <Modal title={editing ? "Sửa loại hoa" : "Thêm loại hoa"} onClose={() => setModalOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="field-label">Tên hoa</label>
              <input
                className="input-field"
                placeholder="VD: Hoa hồng đỏ"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                maxLength={100}
              />
            </div>

            <div>
              <label className="field-label">Phẩm chất</label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {(["DO", "CAM", "TIM", "XANH_LAC", "XANH_LAM"] as Quality[]).map((q) => (
                  <button
                    key={q}
                    onClick={() => setForm((f) => ({ ...f, quality: q }))}
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                    style={
                      form.quality === q
                        ? { background: qualityColor[q], color: "#fff", boxShadow: `0 0 12px ${qualityColor[q]}88` }
                        : { background: "var(--zps-bg-elevated)", color: qualityColor[q], border: `1px solid ${qualityColor[q]}` }
                    }
                  >
                    {qualityLabel[q]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="field-label">Ảnh hoa (tùy chọn)</label>
              {form.imageUrl ? (
                <div className="flex items-center gap-3 mt-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.imageUrl}
                    alt="preview"
                    className="w-16 h-16 rounded-lg object-cover border border-white/10 shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }}
                  />
                  <div className="flex flex-col gap-2 min-w-0">
                    <p className="text-xs text-[var(--zps-text-secondary)] truncate">{form.imageUrl.split("/").pop()}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={openPicker}
                        className="btn-secondary py-1 px-3 text-xs rounded-lg"
                      >
                        Thay ảnh
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                        className="py-1 px-3 text-xs rounded-lg font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        Xóa ảnh
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openPicker}
                  className="mt-1.5 w-full py-3 rounded-xl border-2 border-dashed border-white/20 text-sm text-[var(--zps-text-secondary)] hover:border-white/40 hover:text-white transition-all"
                >
                  + Chọn ảnh từ thư mục
                </button>
              )}
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                onClick={submit}
                disabled={isPending}
                className="btn-primary flex-1 disabled:opacity-60"
              >
                {isPending ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm hoa"}
              </button>
              <button onClick={() => setModalOpen(false)} className="btn-secondary px-4">
                Hủy
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Image picker modal */}
      {pickerOpen && (
        <Modal title="Chọn ảnh hoa" onClose={() => setPickerOpen(false)}>
          {pickerLoading ? (
            <div className="text-center py-10 text-[var(--zps-text-secondary)]">
              <p className="text-2xl mb-2 animate-spin">⏳</p>
              <p className="text-sm">Đang tải danh sách ảnh...</p>
            </div>
          ) : unmappedImages.length === 0 ? (
            <div className="text-center py-10 text-[var(--zps-text-secondary)]">
              <p className="text-3xl mb-2">🗂️</p>
              <p className="text-sm font-medium text-white mb-1">Không có ảnh chưa map</p>
              <p className="text-xs">Copy ảnh vào thư mục <code className="bg-white/10 px-1.5 py-0.5 rounded">public/flowers/</code> rồi thử lại.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-[var(--zps-text-secondary)]">
                {unmappedImages.length} ảnh chưa được gán — click để chọn
              </p>
              <div className="grid grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1">
                {unmappedImages.map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, imageUrl: src }));
                      setPickerOpen(false);
                    }}
                    className="group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-[var(--zps-brand-orange)] transition-all"
                    style={{ background: "var(--zps-bg-elevated)" }}
                    title={src.split("/").pop()}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <Modal title="Xác nhận xóa" onClose={() => setConfirmDelete(null)}>
          <p className="text-[var(--zps-text-secondary)] mb-1">
            Xóa <span className="text-white font-semibold">{confirmDelete.name}</span>?
          </p>
          <p className="text-xs text-red-400 mb-5">
            ⚠️ {confirmDelete._count.ownerships} thành viên sẽ mất hoa này khỏi bộ sưu tập.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => confirmAndDelete(confirmDelete)}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-60"
            >
              {isPending ? "Đang xóa..." : "Xóa"}
            </button>
            <button onClick={() => setConfirmDelete(null)} className="btn-secondary px-4">
              Hủy
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   Tab Thành Viên
══════════════════════════════════════════ */
function MembersTab({ users, flowers, isAdmin }: { users: User[]; flowers: Flower[]; isAdmin: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [nameSearch, setNameSearch] = useState("");
  const [qualityTab, setQualityTab] = useState<Quality | "ALL">("ALL");
  const [selectedFlowerId, setSelectedFlowerId] = useState("");

  const displayName = (u: User) =>
    u.ingameName ?? u.name ?? u.email.split("@")[0];

  // Hoa thuộc quality tab đang chọn
  const flowersInTab = qualityTab === "ALL"
    ? []
    : flowers.filter((f) => f.quality === qualityTab);

  const selectedFlower = flowers.find((f) => f.id === selectedFlowerId) ?? null;

  // Pre-compute set of flowerIds per quality để filter nhanh
  const flowerIdsByQuality = Object.fromEntries(
    (["DO", "CAM", "TIM", "XANH_LAC", "XANH_LAM"] as Quality[]).map((q) => [
      q,
      new Set(flowers.filter((f) => f.quality === q).map((f) => f.id)),
    ])
  ) as Record<Quality, Set<string>>;

  const filtered = users.filter((u) => {
    const ownedIds = new Set(u.ownerships.map((o) => o.flowerTypeId));

    const matchName =
      nameSearch === "" ||
      displayName(u).toLowerCase().includes(nameSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(nameSearch.toLowerCase());

    let matchFlower = true;
    if (selectedFlowerId !== "") {
      matchFlower = ownedIds.has(selectedFlowerId);
    } else if (qualityTab !== "ALL") {
      matchFlower = [...flowerIdsByQuality[qualityTab]].some((id) => ownedIds.has(id));
    }

    return matchName && matchFlower;
  });

  function changeQualityTab(q: Quality | "ALL") {
    setQualityTab(q);
    setSelectedFlowerId(""); // reset flower khi đổi tab
  }

  function approve(userId: string) {
    startTransition(async () => { await approveUser(userId); });
  }

  function changeRole(userId: string, role: "MEMBER" | "ADMIN") {
    startTransition(async () => { await updateUserRole(userId, role); });
  }

  function doDelete(user: User) {
    startTransition(async () => {
      await deleteUser(user.id);
      setConfirmDelete(null);
    });
  }

  return (
    <div className="h-full flex flex-col gap-3">
      {/* ── Filter card ── */}
      <div className="card-gradient space-y-3 shrink-0">
        {/* Tìm tên */}
        <input
          type="text"
          className="input-field"
          placeholder="🔍 Tìm theo tên hoặc email..."
          value={nameSearch}
          onChange={(e) => setNameSearch(e.target.value)}
        />

        {/* Quality tabs */}
        <div>
          <p className="text-xs text-[var(--zps-text-secondary)] uppercase tracking-wider mb-2 font-medium">
            Lọc theo phẩm chất hoa
          </p>
          <div className="flex flex-wrap gap-2">
            {QUALITY_TABS.map((q) => {
              const active = qualityTab === q;
              const color = q !== "ALL" ? qualityColor[q] : undefined;
              return (
                <button
                  key={q}
                  onClick={() => changeQualityTab(q)}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150"
                  style={
                    active
                      ? {
                          background: color ?? "linear-gradient(135deg,#E8341A,#F5A623)",
                          color: "#fff",
                          boxShadow: color ? `0 0 14px ${color}55` : undefined,
                        }
                      : {
                          background: "var(--zps-bg-elevated)",
                          color: color ?? "var(--zps-text-secondary)",
                          border: `1px solid ${color ?? "rgba(255,255,255,0.1)"}`,
                        }
                  }
                >
                  {QUALITY_TAB_LABEL[q]}
                  {q !== "ALL" && (
                    <span className="ml-1.5 text-xs opacity-70">
                      ({flowers.filter((f) => f.quality === q).length})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Flower pills — chỉ hiện khi chọn 1 quality cụ thể */}
        {qualityTab !== "ALL" && flowersInTab.length > 0 && (
          <div>
            <p className="text-xs text-[var(--zps-text-secondary)] uppercase tracking-wider mb-2 font-medium">
              Chọn hoa cụ thể
            </p>
            <div className="flex flex-wrap gap-1.5">
              {flowersInTab.map((f) => {
                const active = selectedFlowerId === f.id;
                const color = qualityColor[f.quality];
                return (
                  <button
                    key={f.id}
                    onClick={() =>
                      setSelectedFlowerId((prev) => (prev === f.id ? "" : f.id))
                    }
                    className="px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150"
                    style={
                      active
                        ? {
                            background: color,
                            color: "#fff",
                            boxShadow: `0 0 10px ${color}66`,
                          }
                        : {
                            background: `${color}18`,
                            color: color,
                            border: `1px solid ${color}55`,
                          }
                    }
                  >
                    {f.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Kết quả + clear */}
        <div className="flex items-center justify-between pt-1 border-t border-white/10">
          <p className="text-sm text-[var(--zps-text-secondary)]">
            <span className="font-bold text-white">{filtered.length}</span>
            {" "}/ {users.length} thành viên
            {selectedFlower && (
              <> có <span className="font-semibold" style={{ color: qualityColor[selectedFlower.quality] }}>
                {selectedFlower.name}
              </span></>
            )}
            {!selectedFlower && qualityTab !== "ALL" && (
              <> có hoa <span className="font-semibold" style={{ color: qualityColor[qualityTab] }}>
                {QUALITY_TAB_LABEL[qualityTab]}
              </span></>
            )}
          </p>
          {(nameSearch || qualityTab !== "ALL" || selectedFlowerId) && (
            <button
              className="text-xs text-[var(--zps-text-secondary)] hover:text-white transition-colors"
              onClick={() => { setNameSearch(""); setQualityTab("ALL"); setSelectedFlowerId(""); }}
            >
              ✕ Xóa filter
            </button>
          )}
        </div>
      </div>

      {/* ── Danh sách ── */}
      <div className="card-gradient !p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
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

          {/* Desktop rows */}
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
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <Modal title="Xác nhận xóa thành viên" onClose={() => setConfirmDelete(null)}>
          <p className="text-[var(--zps-text-secondary)] mb-1">
            Xóa thành viên <span className="text-white font-semibold">{displayName(confirmDelete)}</span>?
          </p>
          <p className="text-xs text-red-400 mb-5">
            ⚠️ Toàn bộ bộ sưu tập hoa của thành viên này sẽ bị xóa.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => doDelete(confirmDelete)}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-60"
            >
              {isPending ? "Đang xóa..." : "Xóa thành viên"}
            </button>
            <button onClick={() => setConfirmDelete(null)} className="btn-secondary px-4">
              Hủy
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   Shared Modal wrapper
══════════════════════════════════════════ */
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="card-gradient w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "modalIn 0.25s ease" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="text-[var(--zps-text-secondary)] hover:text-white text-xl leading-none"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Tab Mùa Giải
══════════════════════════════════════════ */
const TIERS = ["D", "C", "B", "A", "S"] as const;

const TIER_COLOR: Record<string, string> = {
  D: "#8A8FA8",
  C: "#00D68F",
  B: "#4A90D9",
  A: "#7C4DFF",
  S: "#F5A623",
};

interface SeasonForm {
  season: string;
  tier: string;
  rank: string;
  points: string;
}

const EMPTY_SEASON: SeasonForm = { season: "", tier: "D", rank: "1", points: "" };

function SeasonsTab({ seasons, isAdmin }: { seasons: SeasonResult[]; isAdmin: boolean }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SeasonResult | null>(null);
  const [form, setForm] = useState<SeasonForm>(EMPTY_SEASON);
  const [confirmDelete, setConfirmDelete] = useState<SeasonResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_SEASON);
    setError("");
    setModalOpen(true);
  }

  function openEdit(s: SeasonResult) {
    setEditing(s);
    setForm({ season: String(s.season), tier: s.tier, rank: String(s.rank), points: String(s.points) });
    setError("");
    setModalOpen(true);
  }

  function submit() {
    const season = parseInt(form.season);
    const rank   = parseInt(form.rank);
    const points = parseInt(form.points);
    if (!season || !form.tier || !rank || isNaN(points)) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    startTransition(async () => {
      try {
        await upsertSeasonResult({ season, tier: form.tier, rank, points });
        setModalOpen(false);
      } catch {
        setError("Lưu thất bại, thử lại nhé!");
      }
    });
  }

  function confirmDel(s: SeasonResult) {
    setConfirmDelete(s);
  }

  function doDelete() {
    if (!confirmDelete) return;
    startTransition(async () => {
      await deleteSeasonResult(confirmDelete.season);
      setConfirmDelete(null);
    });
  }

  return (
    <div className="h-full flex flex-col gap-3 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <p className="text-sm text-[var(--zps-text-secondary)]">
          {seasons.length} mùa đã ghi nhận
        </p>
        {isAdmin && (
          <button onClick={openAdd} className="btn-primary !py-2 !px-4 text-sm">
            + Thêm mùa
          </button>
        )}
      </div>

      {/* Mobile cards */}
      {seasons.length > 0 && (
        <div className="block sm:hidden card-gradient !p-0 divide-y divide-white/5">
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
      {seasons.length === 0 && (
        <div className="card-gradient text-center py-12 text-[var(--zps-text-secondary)]">
          <p className="text-3xl mb-2">🏆</p>
          <p className="text-sm">Chưa có dữ liệu mùa nào</p>
        </div>
      )}

      {/* Desktop table */}
      {seasons.length > 0 && (
        <div className="hidden sm:block card-gradient !p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--zps-border-divider)" }}>
                {["Mùa", "Hạng đấu", "Thứ hạng", "Điểm", ""].map((h, i) => (
                  <th key={i} className="px-5 py-3 text-left text-xs uppercase tracking-wider text-[var(--zps-text-secondary)] font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--zps-border-divider)]">
              {seasons.map((s) => (
                <tr key={s.id} className="hover:bg-[var(--zps-overlay)] transition-colors">
                  <td className="px-5 py-3 font-bold">Mùa {s.season}</td>
                  <td className="px-5 py-3">
                    <span
                      className="px-2.5 py-1 rounded-lg text-xs font-bold"
                      style={{
                        background: `${TIER_COLOR[s.tier]}22`,
                        color: TIER_COLOR[s.tier],
                        border: `1px solid ${TIER_COLOR[s.tier]}44`,
                      }}
                    >
                      Hạng {s.tier}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {s.rank === 1 ? "🥇" : s.rank === 2 ? "🥈" : s.rank === 3 ? "🥉" : `#${s.rank}`}
                  </td>
                  <td className="px-5 py-3 font-bold tabular-nums" style={{ color: "var(--zps-text-accent)" }}>
                    {s.points.toLocaleString("vi-VN")}
                  </td>
                  <td className="px-5 py-3">
                    {isAdmin && (
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => openEdit(s)}
                          className="text-xs px-2.5 py-1 rounded-lg transition-colors"
                          style={{ background: "var(--zps-bg-elevated)", color: "var(--zps-text-secondary)" }}
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => confirmDel(s)}
                          className="text-xs px-2.5 py-1 rounded-lg transition-colors hover:bg-red-500/10"
                          style={{ color: "#E8341A" }}
                        >
                          Xóa
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative card-gradient w-full max-w-sm space-y-4 z-10">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {editing ? `Sửa Mùa ${editing.season}` : "Thêm mùa mới"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-[var(--zps-text-secondary)] hover:text-[var(--zps-text-primary)]">✕</button>
            </div>

            <div className="space-y-3">
              {/* Số mùa */}
              <div>
                <label className="field-label">Số mùa</label>
                <input
                  type="number" min={1}
                  className="input-field"
                  placeholder="VD: 6"
                  value={form.season}
                  onChange={(e) => setForm((p) => ({ ...p, season: e.target.value }))}
                  disabled={!!editing}
                />
              </div>

              {/* Hạng đấu */}
              <div>
                <label className="field-label">Hạng đấu</label>
                <div className="flex gap-2">
                  {TIERS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm((p) => ({ ...p, tier: t }))}
                      className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
                      style={
                        form.tier === t
                          ? { background: `${TIER_COLOR[t]}33`, color: TIER_COLOR[t], border: `1.5px solid ${TIER_COLOR[t]}` }
                          : { background: "var(--zps-bg-elevated)", color: "var(--zps-text-secondary)", border: "1.5px solid transparent" }
                      }
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Thứ hạng */}
              <div>
                <label className="field-label">Thứ hạng</label>
                <input
                  type="number" min={1}
                  className="input-field"
                  placeholder="1"
                  value={form.rank}
                  onChange={(e) => setForm((p) => ({ ...p, rank: e.target.value }))}
                />
              </div>

              {/* Điểm */}
              <div>
                <label className="field-label">Điểm</label>
                <input
                  type="number" min={0}
                  className="input-field"
                  placeholder="VD: 62244"
                  value={form.points}
                  onChange={(e) => setForm((p) => ({ ...p, points: e.target.value }))}
                />
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1 !py-2.5 text-sm">Hủy</button>
              <button onClick={submit} disabled={isPending} className="btn-primary flex-1 !py-2.5 text-sm disabled:opacity-60">
                {isPending ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative card-gradient w-full max-w-xs text-center space-y-4 z-10">
            <p className="text-3xl">🗑️</p>
            <p className="font-semibold">Xóa Mùa {confirmDelete.season}?</p>
            <p className="text-sm text-[var(--zps-text-secondary)]">Hành động này không thể hoàn tác.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1 !py-2.5 text-sm">Hủy</button>
              <button onClick={doDelete} disabled={isPending} className="btn-primary flex-1 !py-2.5 text-sm disabled:opacity-60" style={{ background: "#E8341A" }}>
                {isPending ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
