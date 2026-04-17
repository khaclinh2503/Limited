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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flower?.id]);

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
                aria-label="Đóng"
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
                    const displayName = owner.ingameName ?? owner.name ?? "Thành viên";
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
                        <p className="text-sm font-medium truncate">{displayName}</p>
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
