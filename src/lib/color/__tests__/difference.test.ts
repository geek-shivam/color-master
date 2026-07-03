import type { Rgb } from "culori";
import { describe, expect, it } from "vitest";
import {
  BLACK,
  WHITE,
  compareColors,
  contrastRatio,
  deltaE2000,
  describeDeltaE,
  oklchDistance,
} from "@/lib/color";
import { mustParse } from "./helpers";

const white = mustParse("#ffffff");
const black = mustParse("#000000");

describe("deltaE2000", () => {
  it("is 100 for black vs white", () => {
    expect(deltaE2000(black, white)).toBeCloseTo(100, 0);
  });

  it("is 0 for identical colors", () => {
    const dodger = mustParse("#1e90ff");
    expect(deltaE2000(dodger, mustParse("#1e90ff"))).toBeCloseTo(0, 10);
  });

  it("is under 1 for a one-byte red difference", () => {
    const d = deltaE2000(mustParse("#ff0000"), mustParse("#fe0000"));
    // Independently computed with culori: ciede2000(#ff0000, #fe0000) = 0.20785...
    expect(d).toBeCloseTo(0.2079, 3);
    expect(d).toBeGreaterThan(0);
    expect(d).toBeLessThan(1);
  });

  it("is symmetric for opaque pairs", () => {
    const a = mustParse("#1e90ff");
    const b = mustParse("#ff0000");
    expect(deltaE2000(a, b)).toBeCloseTo(deltaE2000(b, a), 10);
  });

  it("flattens translucent colors before measuring", () => {
    // rgba(0,0,0,0.5) over white = exact mid gray; dE(gray 0.5, white) = 33.41499...
    const translucentBlack = mustParse("rgba(0, 0, 0, 0.5)");
    const equivalentGray: Rgb = { mode: "rgb", r: 0.5, g: 0.5, b: 0.5 };
    expect(deltaE2000(translucentBlack, white)).toBeCloseTo(
      deltaE2000(equivalentGray, white),
      10,
    );
    expect(deltaE2000(translucentBlack, white)).toBeCloseTo(33.415, 2);
  });
});

describe("oklchDistance", () => {
  it("is 0 for identical colors", () => {
    expect(oklchDistance(mustParse("#1e90ff"), mustParse("#1e90ff"))).toBeCloseTo(0, 10);
  });

  it("never returns NaN for achromatic pairs", () => {
    const d = oklchDistance(mustParse("#808080"), mustParse("#999999"));
    expect(Number.isNaN(d)).toBe(false);
    // Independently computed with culori: euclidean OKLCH distance = 0.083082...
    expect(d).toBeCloseTo(0.0831, 3);
  });

  it("never returns NaN for identical achromatic colors", () => {
    const d = oklchDistance(mustParse("#808080"), mustParse("#808080"));
    expect(Number.isNaN(d)).toBe(false);
    expect(d).toBeCloseTo(0, 10);
  });

  it("grows with perceptual separation", () => {
    const near = oklchDistance(mustParse("#ff0000"), mustParse("#fe0000"));
    const far = oklchDistance(mustParse("#ff0000"), mustParse("#0000ff"));
    expect(far).toBeGreaterThan(near);
  });
});

describe("describeDeltaE", () => {
  it.each([
    [0, "imperceptible"],
    [0.99, "imperceptible"],
    [1, "barely perceptible"],
    [1.99, "barely perceptible"],
    [2, "noticeable"],
    [9.99, "noticeable"],
    [10, "distinct"],
    [48.99, "distinct"],
    [49, "different"],
    [100, "different"],
  ])("describes %f as %s", (d, expected) => {
    expect(describeDeltaE(d)).toBe(expected);
  });
});

describe("compareColors", () => {
  const base = mustParse("#1e90ff");
  const comparison = mustParse("rgba(0, 0, 0, 0.5)");

  it("returns deltaE, oklchDistance and wcag", () => {
    const result = compareColors(base, comparison);
    expect(Object.keys(result).sort()).toEqual(["deltaE", "oklchDistance", "wcag"]);
  });

  it("computes deltaE and oklchDistance for the base/comparison pair", () => {
    const result = compareColors(base, comparison);
    expect(result.deltaE).toBeCloseTo(deltaE2000(base, comparison), 10);
    expect(result.oklchDistance).toBeCloseTo(oklchDistance(base, comparison), 10);
  });

  it("evaluates WCAG with the comparison as foreground over the base", () => {
    // The pair is deliberately asymmetric (translucent comparison) so the
    // two argument orders give different ratios; only (comparison, base) matches.
    const result = compareColors(base, comparison);
    expect(result.wcag.ratio).toBeCloseTo(contrastRatio(comparison, base), 10);
  });
});

describe("backdrop-aware comparison (alpha shows up in metrics)", () => {
  it("distinguishes a color from its translucent twin over the default white backdrop", () => {
    const green = mustParse("hsl(120 100% 37%)");
    const green35 = mustParse("hsla(120, 100%, 37%, 0.35)");
    expect(deltaE2000(green, green35)).toBeGreaterThan(10);
    expect(oklchDistance(green, green35)).toBeGreaterThan(0.05);
    expect(compareColors(green, green35).wcag.ratio).toBeGreaterThan(1.2);
  });

  it("flattens over the provided backdrop", () => {
    const base = mustParse("#1e90ff");
    const translucent = mustParse("rgba(30, 144, 255, 0.35)");
    const overWhite = deltaE2000(base, translucent, WHITE);
    const overBlack = deltaE2000(base, translucent, BLACK);
    expect(overWhite).toBeGreaterThan(0);
    expect(overBlack).toBeGreaterThan(0);
    expect(Math.abs(overWhite - overBlack)).toBeGreaterThan(1);
  });

  it("ignores the backdrop for opaque pairs", () => {
    const a = mustParse("#1e90ff");
    const b = mustParse("#ff0000");
    expect(deltaE2000(a, b, BLACK)).toBeCloseTo(deltaE2000(a, b, WHITE), 10);
  });
});
