"use client";

import { useEffect, useState, useTransition, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPlayerFlowers } from "@/app/actions/players";
import { qualityColor, qualityLabel } from "@/lib/sort";
import type { Quality } from "@prisma/client";

interface Flower {
  id: string;
  name: string;
  quality: Quality;
  imageUrl: string | null;
}

interface Props {
  playerId: string | null;
  playerName: string;
  totalFlowers: number;
  onClose: () => void;
}

const QUALITIES: (Quality | "ALL")[] = ["ALL", "DO", "CAM", "TIM", "XANH_LAM", "XANH_LAC"];
const QUALITY_LABEL: Record<Quality | "ALL", string> = {
  ALL: "Tất cả",
  DO: "Đỏ",
  CAM: "Cam",
  TIM: "Tím",
  XANH_LAC: "Xanh lá",
  XANH_LAM: "Xanh lam",
};

export function PlayerFlowersModal({ playerId, playerName, totalFlowers, onClose }: Props) {
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [qualityFilter, setQualityFilter] = useState<Quality | "ALL">("ALL");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!playerId) return;
    setFlowers([]);
    setOwnedIds(new Set());
    setQualityFilter("ALL");
    startTransition(async () => {
      const data = await getPlayerFlowers(playerId);
      setFlowers(data.flowers);
      setOwnedIds(new Set(data.ownedFlowerIds));
    });
  }, [playerId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const filtered = useMemo(
    () =>
      flowers.filter((f) => {
        if (!ownedIds.has(f.id)) return false;
        if (qualityFilter === "ALL") return true;
        return f.quality === qualityFilter;
      }),
    [flowers, ownedIds, qualityFilter]
  );

  return (
    <AnimatePresence>
      {playerId && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-60 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
          onClick={onClose}
        >
          <motion.div
            key="panel"
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 340 }}
            className="card-gradient flex flex-col w-[95vw] sm:w-full sm:max-w-2xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between shrink-0 mb-4">
              <div>
                <h2 className="font-bold text-lg">Hoa của {playerName}</h2>
                <p className="text-sm text-[var(--zps-text-secondary)]">
                  🌸 {totalFlowers} loại hoa
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Đóng"
                className="text-[var(--zps-text-secondary)] hover:text-white text-xl leading-none p-1 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Quality filter */}
            <div className="flex flex-wrap gap-2 shrink-0 mb-4">
              {QUALITIES.map((q) => {
                const active = qualityFilter === q;
                const color = q !== "ALL" ? qualityColor[q as Quality] : undefined;
                const count =
                  q === "ALL"
                    ? ownedIds.size
                    : flowers.filter((f) => f.quality === q && ownedIds.has(f.id)).length;
                return (
                  <button
                    key={q}
                    onClick={() => setQualityFilter(q)}
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150"
                    style={
                      active
                        ? {
                            background:
                              color ?? "linear-gradient(135deg,#E8341A,#F5A623)",
                            color: "#fff",
                            boxShadow: color ? `0 0 12px ${color}55` : undefined,
                          }
                        : {
                            background: "var(--zps-bg-elevated)",
                            color: color ?? "var(--zps-text-secondary)",
                            border: `1px solid ${color ?? "rgba(255,255,255,0.1)"}`,
                          }
                    }
                  >
                    {QUALITY_LABEL[q]}
                    <span className="ml-1.5 text-xs opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {isPending ? (
                <div className="flex items-center justify-center py-16 text-[var(--zps-text-secondary)]">
                  <p className="text-2xl mb-2">⏳</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-[var(--zps-text-secondary)]">
                  <p className="text-3xl mb-2">🌱</p>
                  <p className="text-sm">
                    {ownedIds.size === 0
                      ? "Chưa có hoa nào"
                      : "Không có hoa trong mục này"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                  {filtered.map((flower) => {
                    const color = qualityColor[flower.quality];
                    return (
                      <div
                        key={flower.id}
                        className="flex flex-col items-center gap-1"
                        title={`${flower.name} — ${qualityLabel[flower.quality]}`}
                      >
                        <div
                          className="w-full aspect-square rounded-lg overflow-hidden flex items-center justify-center mb-1"
                          style={{
                            background: "var(--zps-bg-page)",
                            border: `1.5px solid ${color}`,
                            boxShadow: `0 0 8px ${color}33`,
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
                        <p
                          className="text-[10px] sm:text-xs leading-tight line-clamp-2 break-words font-medium w-full text-center overflow-hidden"
                          style={{ color }}
                        >
                          {flower.name}
                        </p>
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
