"use client";

import { useState, useTransition, useMemo } from "react";
import { updateMyOwnerships } from "@/app/actions/ownerships";
import { qualityColor, qualityLabel, qualityBgGradient } from "@/lib/sort";
import type { Quality } from "@prisma/client";

interface Flower {
  id: string;
  name: string;
  quality: Quality;
  imageUrl: string | null;
}

interface Props {
  flowers: Flower[];
  ownedFlowerIds: string[];
}

const QUALITIES: (Quality | "ALL")[] = [
  "ALL", "DO", "CAM", "TIM", "XANH_LAM", "XANH_LAC",
];

const QUALITY_LABEL: Record<Quality | "ALL", string> = {
  ALL: "Tất cả",
  DO: "Đỏ",
  CAM: "Cam",
  TIM: "Tím",
  XANH_LAC: "Xanh lá",
  XANH_LAM: "Xanh lam",
};

export function FlowerGrid({ flowers, ownedFlowerIds }: Props) {
  const [selected, setSelected] = useState(() => new Set(ownedFlowerIds));
  const [filter, setFilter] = useState<Quality | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const filtered = useMemo(() => {
    return flowers.filter((f) => {
      const matchQ = filter === "ALL" || f.quality === filter;
      const matchS = f.name.toLowerCase().includes(search.toLowerCase());
      return matchQ && matchS;
    });
  }, [flowers, filter, search]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((f) => selected.has(f.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filtered.forEach((f) => next.delete(f.id));
      } else {
        filtered.forEach((f) => next.add(f.id));
      }
      return next;
    });
  }

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  function save() {
    startTransition(async () => {
      try {
        await updateMyOwnerships(Array.from(selected));
        showToast("Đã lưu bộ sưu tập hoa! 🌸", true);
      } catch {
        showToast("Lưu thất bại, thử lại nhé!", false);
      }
    });
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Search + filter */}
      <div className="space-y-3">
        <input
          type="text"
          className="input-field"
          placeholder="🔍 Tìm kiếm hoa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Quality filter tabs */}
        <div className="flex flex-wrap gap-2">
          {QUALITIES.map((q) => {
            const active = filter === q;
            const color = q !== "ALL" ? qualityColor[q] : undefined;
            return (
              <button
                key={q}
                onClick={() => setFilter(q)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
                style={
                  active
                    ? {
                        background: color ?? "var(--zps-brand-gradient)",
                        color: "#fff",
                        boxShadow: color ? `0 0 12px ${color}66` : undefined,
                      }
                    : {
                        background: "var(--zps-bg-elevated)",
                        color: color ?? "var(--zps-text-secondary)",
                        border: `1px solid ${color ?? "rgba(255,255,255,0.1)"}`,
                      }
                }
              >
                {QUALITY_LABEL[q]}
              </button>
            );
          })}
        </div>

        {/* Select all + count */}
        <div className="flex items-center justify-between">
          <button
            onClick={toggleAll}
            className="text-sm font-medium transition-colors"
            style={{ color: "var(--zps-brand-orange)" }}
          >
            {allFilteredSelected ? "✕ Bỏ chọn tất cả" : "✓ Chọn tất cả"}
            {filter !== "ALL" && (
              <span className="ml-1 text-[var(--zps-text-secondary)]">
                ({qualityLabel[filter as Quality]})
              </span>
            )}
          </button>
          <span className="text-sm text-[var(--zps-text-secondary)]">
            Đang chọn{" "}
            <span className="font-bold" style={{ color: "var(--zps-brand-orange)" }}>
              {selected.size}
            </span>{" "}
            / {flowers.length} loại
          </span>
        </div>
      </div>

      {/* Flower grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-[var(--zps-text-secondary)]">
            <p className="text-3xl mb-2">🌱</p>
            <p className="text-sm">Không tìm thấy hoa nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {filtered.map((flower) => {
              const isSelected = selected.has(flower.id);
              const color = qualityColor[flower.quality];
              return (
                <button
                  key={flower.id}
                  onClick={() => toggle(flower.id)}
                  className={`flower-card ${isSelected ? "selected" : ""} flex flex-col items-center`}
                  style={
                    isSelected
                      ? {
                          borderColor: color,
                          boxShadow: `0 0 20px ${color}88, inset 0 0 12px ${color}22`,
                        }
                      : {}
                  }
                >
                  {/* Ảnh hoa */}
                  <div
                    className="w-full aspect-square rounded-lg overflow-hidden flex items-center justify-center mb-1"
                    style={{
                      background: qualityBgGradient(flower.quality),
                      border: `1.5px solid ${isSelected ? color : "rgba(255,255,255,0.06)"}`,
                    }}
                  >
                    {flower.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={flower.imageUrl}
                        alt={flower.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">🌸</span>
                    )}
                  </div>

                  {/* Tên hoa — line-clamp-2 giới hạn 2 dòng */}
                  <p
                    className="text-sm leading-tight line-clamp-4 break-words font-medium w-full text-center px-0.5"
                    style={{ color: isSelected ? color : "var(--zps-text-secondary)" }}
                  >
                    {flower.name}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Save button */}
      <button
        onClick={save}
        disabled={isPending}
        className="btn-primary w-full text-center disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Đang lưu..." : "💾 Lưu bộ sưu tập"}
      </button>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl"
          style={{
            background: toast.ok ? "var(--zps-accent-green)" : "#E8341A",
            color: "#fff",
            animation: "fadeInUp 0.3s ease",
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
