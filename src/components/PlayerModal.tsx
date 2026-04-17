"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect } from "react";
import { qualityColor, qualityLabel } from "@/lib/sort";
import type { Quality } from "@prisma/client";

interface TopFlower {
  id: string;
  name: string;
  quality: Quality;
  imageUrl: string | null;
}

interface PlayerDetail {
  id: string;
  name: string | null;
  ingameName: string | null;
  image: string | null;
  bio: string | null;
  gameId: string | null;
  totalFlowers: number;
  topFlowers: TopFlower[];
}

interface PlayerModalProps {
  player: PlayerDetail | null;
  onClose: () => void;
}

const RANK_LABELS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export function PlayerModal({ player, onClose }: PlayerModalProps) {
  // Đóng khi nhấn Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const displayName = player?.ingameName ?? player?.name ?? "Ẩn danh";

  return (
    <AnimatePresence>
      {player && (
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
            className="card-gradient w-[95vw] sm:w-full sm:max-w-lg max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                {player.image ? (
                  <Image
                    src={player.image}
                    alt={displayName}
                    width={72}
                    height={72}
                    className="rounded-full ring-4 ring-[var(--zps-brand-orange)]"
                  />
                ) : (
                  <div
                    className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-2xl font-bold ring-4 ring-[var(--zps-brand-orange)]"
                    style={{ background: "var(--zps-bg-elevated)" }}
                  >
                    {displayName[0].toUpperCase()}
                  </div>
                )}

                {/* Info */}
                <div>
                  <h2 className="text-xl font-bold">{displayName}</h2>
                  {player.gameId && (
                    <p className="text-sm text-[var(--zps-text-secondary)]">
                      ID: {player.gameId}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-lg">🌸</span>
                    <span className="font-bold text-[var(--zps-brand-orange)]">
                      {player.totalFlowers}
                    </span>
                    <span className="text-sm text-[var(--zps-text-secondary)]">loại hoa</span>
                  </div>
                </div>
              </div>

              {/* Close */}
              <button
                onClick={onClose}
                className="text-[var(--zps-text-secondary)] hover:text-white transition-colors p-1 text-xl leading-none"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            {/* Bio */}
            {player.bio && (
              <p className="text-sm text-[var(--zps-text-secondary)] mb-6 italic border-l-2 pl-3"
                style={{ borderColor: "var(--zps-brand-orange)" }}>
                {player.bio}
              </p>
            )}

            {/* Top 10 hoa phẩm chất cao */}
            {player.topFlowers.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--zps-text-secondary)] uppercase tracking-wider mb-3">
                  Top hoa phẩm chất cao
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {player.topFlowers.map((flower) => {
                    const color = qualityColor[flower.quality];
                    return (
                      <div
                        key={flower.id}
                        className="flex flex-col items-center gap-1"
                        title={`${flower.name} — ${qualityLabel[flower.quality]}`}
                      >
                        <div
                          className="w-10 h-10 sm:w-[60px] sm:h-[60px] rounded-xl overflow-hidden flex items-center justify-center"
                          style={{
                            background: "var(--zps-bg-elevated)",
                            border: `2px solid ${color}`,
                            boxShadow: `0 0 12px ${color}55`,
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
                          className="text-[10px] text-center leading-tight line-clamp-2 w-full"
                          style={{ color }}
                        >
                          {flower.name}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {player.topFlowers.length === 0 && (
              <div className="text-center py-8 text-[var(--zps-text-secondary)]">
                <p className="text-3xl mb-2">🌱</p>
                <p className="text-sm">Chưa có hoa nào trong bộ sưu tập</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { RANK_LABELS };
