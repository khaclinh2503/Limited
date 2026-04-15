import type { Quality } from "@prisma/client";

// Thứ tự phẩm chất: cao → thấp (Đỏ > Cam > Tím > Xanh lam > Xanh lá)
export const qualityOrder: Record<Quality, number> = {
  DO: 1,
  CAM: 2,
  TIM: 3,
  XANH_LAM: 4,
  XANH_LAC: 5,
};

export const qualityLabel: Record<Quality, string> = {
  DO: "Đỏ",
  CAM: "Cam",
  TIM: "Tím",
  XANH_LAC: "Xanh lá",
  XANH_LAM: "Xanh lam",
};

export const qualityColor: Record<Quality, string> = {
  DO: "#E8341A",
  CAM: "#F5A623",
  TIM: "#7C4DFF",
  XANH_LAC: "#00D68F",
  XANH_LAM: "#4A90D9",
};

export function sortFlowersByQuality<T extends { quality: Quality }>(
  flowers: T[]
): T[] {
  return [...flowers].sort(
    (a, b) => qualityOrder[a.quality] - qualityOrder[b.quality]
  );
}
