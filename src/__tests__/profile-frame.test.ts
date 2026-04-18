import { describe, it, expect } from "vitest";

const FRAME_REGEX = /^\/frame\/\d+\.png$/;

describe("frame path validation", () => {
  it("chấp nhận path hợp lệ", () => {
    expect(FRAME_REGEX.test("/frame/1.png")).toBe(true);
    expect(FRAME_REGEX.test("/frame/49.png")).toBe(true);
    expect(FRAME_REGEX.test("/frame/100.png")).toBe(true);
  });

  it("từ chối path không hợp lệ", () => {
    expect(FRAME_REGEX.test("/avatar/1.png")).toBe(false);
    expect(FRAME_REGEX.test("/frame/abc.png")).toBe(false);
    expect(FRAME_REGEX.test("frame/1.png")).toBe(false);
    expect(FRAME_REGEX.test("/frame/1.jpg")).toBe(false);
    expect(FRAME_REGEX.test("")).toBe(false);
  });
});
