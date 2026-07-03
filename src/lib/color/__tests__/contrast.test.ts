import type { Rgb } from "culori";
import { describe, expect, it } from "vitest";
import { BLACK, WHITE, contrastRatio, evaluateWcag, WCAG } from "@/lib/color";
import { mustParse } from "./helpers";

const white = mustParse("#ffffff");
const black = mustParse("#000000");

describe("WCAG thresholds", () => {
  it("exports the WCAG 2.1 threshold constants", () => {
    expect(WCAG).toEqual({
      AA_NORMAL: 4.5,
      AA_LARGE: 3,
      AAA_NORMAL: 7,
      AAA_LARGE: 4.5,
    });
  });
});

describe("contrastRatio", () => {
  it("is exactly 21 for black on white", () => {
    expect(contrastRatio(black, white)).toBeCloseTo(21, 5);
  });

  it("is 1 for white on white", () => {
    expect(contrastRatio(white, white)).toBeCloseTo(1, 10);
  });

  it("is symmetric for opaque pairs", () => {
    const dodger = mustParse("#1e90ff");
    const forward = contrastRatio(dodger, white);
    const backward = contrastRatio(white, dodger);
    // Independently computed with culori: wcagContrast(#1e90ff, white) = 3.2364916...
    expect(forward).toBeCloseTo(3.23649, 4);
    expect(forward).toBeCloseTo(backward, 10);
  });

  it("flattens a translucent foreground over the (white-backed) background", () => {
    // rgba(0,0,0,0.5) over white composites to the exact mid gray rgb(0.5, 0.5, 0.5)
    const translucentBlack = mustParse("rgba(0, 0, 0, 0.5)");
    const equivalentGray: Rgb = { mode: "rgb", r: 0.5, g: 0.5, b: 0.5 };
    const viaAlpha = contrastRatio(translucentBlack, white);
    const viaFlatGray = contrastRatio(equivalentGray, white);
    expect(viaAlpha).toBeCloseTo(viaFlatGray, 10);
    // Independently computed: wcagContrast(gray 0.5, white) = 3.976653...
    expect(viaAlpha).toBeCloseTo(3.9767, 3);
  });

  it("flattens a translucent background over white first", () => {
    // Background rgba(0,0,0,0.5) renders as mid gray on a white page;
    // black text on that gray: independently computed ratio 5.280822...
    const translucentBlackBg = mustParse("rgba(0, 0, 0, 0.5)");
    expect(contrastRatio(black, translucentBlackBg)).toBeCloseTo(5.2808, 3);
  });
});

describe("evaluateWcag", () => {
  it("reports the same ratio as contrastRatio", () => {
    const dodger = mustParse("#1e90ff");
    expect(evaluateWcag(dodger, white).ratio).toBeCloseTo(contrastRatio(dodger, white), 10);
  });

  it("passes every level for black on white", () => {
    expect(evaluateWcag(black, white)).toMatchObject({
      aaNormal: true,
      aaLarge: true,
      aaaNormal: true,
      aaaLarge: true,
    });
  });

  it("fails every level for white on white", () => {
    expect(evaluateWcag(white, white)).toMatchObject({
      aaNormal: false,
      aaLarge: false,
      aaaNormal: false,
      aaaLarge: false,
    });
  });

  it("#767676 on white just passes AA normal (ratio ~4.54)", () => {
    const result = evaluateWcag(mustParse("#767676"), white);
    // Independently computed: 4.542224959...
    expect(result.ratio).toBeCloseTo(4.5422, 3);
    expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    expect(result).toMatchObject({
      aaNormal: true,
      aaLarge: true,
      aaaNormal: false,
      aaaLarge: true, // AAA large shares the 4.5 threshold
    });
  });

  it("#777777 on white just fails AA normal (ratio ~4.48) but passes AA large", () => {
    const result = evaluateWcag(mustParse("#777777"), white);
    // Independently computed: 4.478089453...
    expect(result.ratio).toBeCloseTo(4.4781, 3);
    expect(result.ratio).toBeLessThan(4.5);
    expect(result).toMatchObject({
      aaNormal: false,
      aaLarge: true,
      aaaNormal: false,
      aaaLarge: false,
    });
  });

  it("wcag evaluation is symmetric for opaque pairs", () => {
    const a = mustParse("#1e90ff");
    const b = mustParse("#123456");
    expect(evaluateWcag(a, b).ratio).toBeCloseTo(evaluateWcag(b, a).ratio, 10);
  });
});

describe("contrast with explicit backdrop", () => {
  it("is 21 for black on white over any backdrop (opaque colors ignore it)", () => {
    expect(contrastRatio(black, white, BLACK)).toBeCloseTo(21, 5);
  });

  it("no longer lets a translucent color disappear into its opaque twin", () => {
    const green = mustParse("hsl(120 100% 37%)");
    const green35 = mustParse("hsla(120, 100%, 37%, 0.35)");
    expect(contrastRatio(green35, green)).toBeGreaterThan(1.2);
  });

  it("reads differently over white vs black backdrops for translucent pairs", () => {
    const black50 = mustParse("rgba(0, 0, 0, 0.5)");
    const white50 = mustParse("rgba(255, 255, 255, 0.5)");
    const overWhite = contrastRatio(black50, white50, WHITE);
    const overBlack = contrastRatio(black50, white50, BLACK);
    expect(Math.abs(overWhite - overBlack)).toBeGreaterThan(0.5);
  });
});

describe("gamut alignment", () => {
  it("computes contrast on the gamut-mapped color that actually renders", () => {
    // Raw oklch(0.6 0.37 30) vs white would give 4.81:1, but the color that
    // renders on screen is the sRGB-mapped one at 4.2248:1 — an AA fail.
    const wide = mustParse("oklch(0.6 0.37 30)");
    expect(contrastRatio(wide, white)).toBeCloseTo(4.2248, 3);
    expect(evaluateWcag(wide, white).aaNormal).toBe(false);
  });
});
