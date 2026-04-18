import { describe, it, expect } from "vitest";
import {
  qualityOrder,
  qualityLabel,
  qualityColor,
  sortFlowersByQuality,
} from "@/lib/sort";

describe("qualityOrder", () => {
  it("DO (đỏ) có rank cao nhất (số nhỏ nhất = 1)", () => {
    expect(qualityOrder.DO).toBe(1);
  });

  it("XANH_LAC (xanh lá) có rank thấp nhất (số lớn nhất = 5)", () => {
    expect(qualityOrder.XANH_LAC).toBe(5);
  });

  it("thứ tự đúng: DO < CAM < TIM < XANH_LAM < XANH_LAC", () => {
    expect(qualityOrder.DO).toBeLessThan(qualityOrder.CAM);
    expect(qualityOrder.CAM).toBeLessThan(qualityOrder.TIM);
    expect(qualityOrder.TIM).toBeLessThan(qualityOrder.XANH_LAM);
    expect(qualityOrder.XANH_LAM).toBeLessThan(qualityOrder.XANH_LAC);
  });

  it("5 quality có 5 rank khác nhau", () => {
    const values = Object.values(qualityOrder);
    expect(new Set(values).size).toBe(5);
  });
});

describe("qualityLabel", () => {
  it("DO → 'Đỏ'", () => {
    expect(qualityLabel.DO).toBe("Đỏ");
  });

  it("XANH_LAC → 'Xanh lá'", () => {
    expect(qualityLabel.XANH_LAC).toBe("Xanh lá");
  });

  it("tất cả 5 quality đều có label", () => {
    const keys: (keyof typeof qualityLabel)[] = [
      "DO",
      "CAM",
      "TIM",
      "XANH_LAM",
      "XANH_LAC",
    ];
    for (const key of keys) {
      expect(qualityLabel[key]).toBeTruthy();
    }
  });
});

describe("qualityColor", () => {
  it("mỗi color là chuỗi hex hợp lệ (#RRGGBB)", () => {
    const keys: (keyof typeof qualityColor)[] = [
      "DO",
      "CAM",
      "TIM",
      "XANH_LAM",
      "XANH_LAC",
    ];
    for (const key of keys) {
      expect(qualityColor[key]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe("sortFlowersByQuality", () => {
  it("sắp xếp từ quality cao nhất (DO) đến thấp nhất (XANH_LAC)", () => {
    const flowers = [
      { quality: "XANH_LAC" as const, name: "Cỏ" },
      { quality: "DO" as const, name: "Hoa đỏ" },
      { quality: "CAM" as const, name: "Hoa cam" },
      { quality: "TIM" as const, name: "Hoa tím" },
      { quality: "XANH_LAM" as const, name: "Hoa lam" },
    ];
    const sorted = sortFlowersByQuality(flowers);
    expect(sorted.map((f) => f.quality)).toEqual([
      "DO",
      "CAM",
      "TIM",
      "XANH_LAM",
      "XANH_LAC",
    ]);
  });

  it("không mutate array gốc", () => {
    const flowers = [
      { quality: "XANH_LAC" as const },
      { quality: "DO" as const },
    ];
    const original = [...flowers];
    sortFlowersByQuality(flowers);
    expect(flowers[0].quality).toBe(original[0].quality);
    expect(flowers[1].quality).toBe(original[1].quality);
  });

  it("trả về array rỗng khi input rỗng", () => {
    expect(sortFlowersByQuality([])).toEqual([]);
  });

  it("array 1 phần tử trả về chính nó", () => {
    const flowers = [{ quality: "TIM" as const, name: "Tím" }];
    expect(sortFlowersByQuality(flowers)).toEqual(flowers);
  });

  it("giữ nguyên thứ tự khi các flower cùng quality", () => {
    const flowers = [
      { quality: "CAM" as const, name: "A" },
      { quality: "CAM" as const, name: "B" },
    ];
    const sorted = sortFlowersByQuality(flowers);
    expect(sorted[0].name).toBe("A");
    expect(sorted[1].name).toBe("B");
  });
});
