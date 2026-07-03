import { describe, expect, it } from "vitest";
import { BLACK, flattenOver, formatColor, getAlpha, WHITE, withAlpha } from "@/lib/color";
import { mustParse } from "./helpers";

describe("WHITE / BLACK constants", () => {
  it("WHITE is opaque rgb(1, 1, 1)", () => {
    expect(WHITE).toMatchObject({ mode: "rgb", r: 1, g: 1, b: 1 });
  });

  it("BLACK is opaque rgb(0, 0, 0)", () => {
    expect(BLACK).toMatchObject({ mode: "rgb", r: 0, g: 0, b: 0 });
  });
});

describe("getAlpha", () => {
  it("defaults to 1 when alpha is absent", () => {
    expect(getAlpha({ mode: "rgb", r: 0.5, g: 0.5, b: 0.5 })).toBe(1);
  });

  it("returns the stored alpha", () => {
    expect(getAlpha({ mode: "rgb", r: 0, g: 0, b: 0, alpha: 0.25 })).toBe(0.25);
    expect(getAlpha(mustParse("#1e90ff80"))).toBeCloseTo(128 / 255, 10);
  });

  it("returns 0 for a fully transparent color", () => {
    expect(getAlpha({ mode: "rgb", r: 0, g: 0, b: 0, alpha: 0 })).toBe(0);
  });

  it("clamps out-of-range alpha into [0, 1]", () => {
    expect(getAlpha({ mode: "rgb", r: 0, g: 0, b: 0, alpha: -0.5 })).toBe(0);
    expect(getAlpha({ mode: "rgb", r: 0, g: 0, b: 0, alpha: 1.5 })).toBe(1);
  });
});

describe("withAlpha", () => {
  it("removes the alpha property entirely when set to 1", () => {
    const result = withAlpha(mustParse("#1e90ff80"), 1);
    expect("alpha" in result).toBe(false);
  });

  it("removes the alpha property when set above 1", () => {
    const result = withAlpha(mustParse("#1e90ff80"), 2);
    expect("alpha" in result).toBe(false);
  });

  it("sets a fractional alpha", () => {
    const result = withAlpha(mustParse("#1e90ff"), 0.25);
    expect(result.alpha).toBe(0.25);
  });

  it("keeps an explicit alpha of 0", () => {
    const result = withAlpha(mustParse("#1e90ff"), 0);
    expect(result.alpha).toBe(0);
  });

  it("clamps negative alpha to 0", () => {
    const result = withAlpha(mustParse("#1e90ff"), -0.5);
    expect(result.alpha).toBe(0);
  });

  it("preserves the color channels and mode", () => {
    const original = mustParse("#1e90ff");
    const result = withAlpha(original, 0.5);
    expect(result).toMatchObject({
      mode: "rgb",
      r: 30 / 255,
      g: 144 / 255,
      b: 255 / 255,
      alpha: 0.5,
    });
  });

  it("does not mutate its input", () => {
    const original = mustParse("#1e90ff80");
    const originalAlpha = original.alpha;
    withAlpha(original, 1);
    withAlpha(original, 0.1);
    expect(original.alpha).toBe(originalAlpha);
  });
});

describe("flattenOver", () => {
  it("composites 50% red over white to rgb(1, 0.5, 0.5)", () => {
    const flat = flattenOver(mustParse("rgba(255, 0, 0, 0.5)"), WHITE);
    expect(flat.mode).toBe("rgb");
    expect(flat.r).toBeCloseTo(1, 10);
    expect(flat.g).toBeCloseTo(0.5, 10);
    expect(flat.b).toBeCloseTo(0.5, 10);
  });

  it("serializes the 50% red over white composite as rgb(255, 128, 128)", () => {
    const flat = flattenOver(mustParse("rgba(255, 0, 0, 0.5)"), WHITE);
    expect(formatColor(flat, "rgb")).toBe("rgb(255, 128, 128)");
  });

  it("always yields an opaque result", () => {
    expect(flattenOver(mustParse("rgba(255, 0, 0, 0.5)"), WHITE).alpha).toBe(1);
    expect(flattenOver(mustParse("#1e90ff"), WHITE).alpha).toBe(1);
  });

  it("returns the foreground channels when the foreground is opaque", () => {
    const flat = flattenOver(mustParse("#1e90ff"), BLACK);
    expect(flat.r).toBeCloseTo(30 / 255, 10);
    expect(flat.g).toBeCloseTo(144 / 255, 10);
    expect(flat.b).toBeCloseTo(255 / 255, 10);
  });

  it("returns the backdrop channels when the foreground is fully transparent", () => {
    const flat = flattenOver(mustParse("rgba(255, 0, 0, 0)"), mustParse("#1e90ff"));
    expect(flat.r).toBeCloseTo(30 / 255, 10);
    expect(flat.g).toBeCloseTo(144 / 255, 10);
    expect(flat.b).toBeCloseTo(255 / 255, 10);
  });

  it("treats the backdrop as opaque, ignoring its alpha", () => {
    const semiBlue = mustParse("rgba(0, 0, 255, 0.3)");
    const flat = flattenOver(mustParse("rgba(255, 0, 0, 0.5)"), semiBlue);
    // out = fg * 0.5 + bg * 0.5, with the backdrop's 0.3 alpha ignored
    expect(flat.r).toBeCloseTo(0.5, 10);
    expect(flat.g).toBeCloseTo(0, 10);
    expect(flat.b).toBeCloseTo(0.5, 10);
  });

  it("converts non-rgb inputs before compositing", () => {
    const flat = flattenOver(mustParse("hsl(0 100% 50% / 0.5)"), WHITE);
    expect(flat.r).toBeCloseTo(1, 10);
    expect(flat.g).toBeCloseTo(0.5, 10);
    expect(flat.b).toBeCloseTo(0.5, 10);
  });
});
