import { converter } from "culori";
import { describe, expect, it } from "vitest";
import {
  fmtNum,
  formatColor,
  getAlpha,
  parseColor,
  roundTo,
  toAllFormats,
  toCss,
  toSrgbSafe,
} from "@/lib/color";
import { mustParse } from "./helpers";

const toRgb = converter("rgb");

describe("roundTo", () => {
  it("rounds halves away from zero for positives", () => {
    expect(roundTo(2.5, 0)).toBe(3);
    expect(roundTo(3.5, 0)).toBe(4);
    expect(roundTo(0.125, 2)).toBe(0.13);
  });

  it("rounds halves away from zero for negatives", () => {
    expect(roundTo(-2.5, 0)).toBe(-3);
    expect(roundTo(-0.125, 2)).toBe(-0.13);
  });

  it("rounds ordinary values to the requested precision", () => {
    expect(roundTo(1.2344, 2)).toBe(1.23);
    expect(roundTo(253.20541, 2)).toBe(253.21);
    expect(roundTo(0.190119, 4)).toBe(0.1901);
  });

  it("never returns negative zero", () => {
    const result = roundTo(-0.0004, 3);
    expect(result).toBe(0);
    expect(Object.is(result, -0)).toBe(false);
  });
});

describe("fmtNum", () => {
  it("trims trailing zeros", () => {
    expect(fmtNum(0.5, 3)).toBe("0.5");
    expect(fmtNum(0.7, 4)).toBe("0.7");
    expect(fmtNum(100.0, 1)).toBe("100");
  });

  it("keeps significant decimals up to the limit", () => {
    expect(fmtNum(0.50196, 3)).toBe("0.502");
    expect(fmtNum(55.88235, 1)).toBe("55.9");
  });

  it("collapses tiny negatives to plain 0", () => {
    expect(fmtNum(-0.0001, 3)).toBe("0");
  });
});

describe("formatColor", () => {
  describe("opaque #1e90ff (dodgerblue)", () => {
    const dodger = mustParse("#1e90ff");

    it("serializes rgb with integer channels", () => {
      expect(formatColor(dodger, "rgb")).toBe("rgb(30, 144, 255)");
    });

    it("serializes hsl in legacy comma syntax at 1dp", () => {
      expect(formatColor(dodger, "hsl")).toBe("hsl(209.6, 100%, 55.9%)");
    });

    it("serializes lowercase 6-digit hex", () => {
      expect(formatColor(dodger, "hex")).toBe("#1e90ff");
    });

    it("serializes oklch with L/C at 4dp and H at 2dp", () => {
      // Independently computed with culori: oklch(#1e90ff) =
      // l 0.652005..., c 0.190119..., h 253.20541...
      expect(formatColor(dodger, "oklch")).toBe("oklch(0.652 0.1901 253.21)");
    });
  });

  describe("translucent #1e90ff80", () => {
    const dodger80 = mustParse("#1e90ff80");

    it("serializes rgba with alpha at 3dp", () => {
      expect(formatColor(dodger80, "rgb")).toBe("rgba(30, 144, 255, 0.502)");
    });

    it("serializes hsla with alpha at 3dp", () => {
      expect(formatColor(dodger80, "hsl")).toBe("hsla(209.6, 100%, 55.9%, 0.502)");
    });

    it("round-trips the 8-digit hex", () => {
      expect(formatColor(dodger80, "hex")).toBe("#1e90ff80");
    });

    it("serializes oklch with a slash-alpha", () => {
      expect(formatColor(dodger80, "oklch")).toBe("oklch(0.652 0.1901 253.21 / 0.502)");
    });

    it("trims trailing zeros in alpha (0.5, not 0.500)", () => {
      const half = mustParse("rgba(30, 144, 255, 0.5)");
      expect(formatColor(half, "rgb")).toBe("rgba(30, 144, 255, 0.5)");
      expect(formatColor(half, "hsl")).toBe("hsla(209.6, 100%, 55.9%, 0.5)");
    });

    it("rounds the alpha byte for hex output", () => {
      // 64/255 = 0.25098... -> 0.251 at 3dp; hex byte stays 0x40
      const quarter = mustParse("#1e90ff40");
      expect(formatColor(quarter, "rgb")).toBe("rgba(30, 144, 255, 0.251)");
      expect(formatColor(quarter, "hex")).toBe("#1e90ff40");
    });
  });

  describe("achromatic #808080", () => {
    const gray = mustParse("#808080");

    it("serializes hsl with hue 0 and no NaN", () => {
      expect(formatColor(gray, "hsl")).toBe("hsl(0, 0%, 50.2%)");
    });

    it("serializes oklch with hue 0 and no NaN/none", () => {
      // Independently computed with culori: oklch(#808080) l = 0.5998708..., c = 0
      expect(formatColor(gray, "oklch")).toBe("oklch(0.5999 0 0)");
    });

    it("serializes rgb and hex untouched", () => {
      expect(formatColor(gray, "rgb")).toBe("rgb(128, 128, 128)");
      expect(formatColor(gray, "hex")).toBe("#808080");
    });
  });

  describe("hue normalization", () => {
    it("normalizes negative hues into [0, 360)", () => {
      expect(formatColor(mustParse("hsl(-90, 100%, 50%)"), "hsl")).toBe("hsl(270, 100%, 50%)");
    });

    it("normalizes hues of 360 and beyond", () => {
      expect(formatColor(mustParse("hsl(400, 100%, 50%)"), "hsl")).toBe("hsl(40, 100%, 50%)");
      expect(formatColor(mustParse("hsl(360, 100%, 50%)"), "hsl")).toBe("hsl(0, 100%, 50%)");
    });
  });

  describe("out-of-sRGB-gamut oklch(0.7 0.35 150)", () => {
    const wide = mustParse("oklch(0.7 0.35 150)");

    it("round-trips its own L/C/H through the oklch target", () => {
      expect(formatColor(wide, "oklch")).toBe("oklch(0.7 0.35 150)");
    });

    it("gamut-maps for the rgb target", () => {
      // Independently computed: CSS4 mapping of oklch(0.7 0.35 150) into sRGB
      // gives rgb(0, 0.76072..., 0.28063...) -> bytes (0, 194, 72)
      expect(formatColor(wide, "rgb")).toBe("rgb(0, 194, 72)");
    });

    it("gamut-maps for the hex target", () => {
      expect(formatColor(wide, "hex")).toBe("#00c248");
    });

    it("gamut-maps for the hsl target", () => {
      // Same mapped color in HSL: h 142.1338..., s 1, l 0.380360...
      expect(formatColor(wide, "hsl")).toBe("hsl(142.1, 100%, 38%)");
    });
  });

  describe("round-trip property", () => {
    const inGamutInputs = [
      "#1e90ff",
      "#1e90ff80",
      "#808080",
      "#ff0000",
      "#123456",
      "hsl(300, 40%, 60%)",
      "rgba(30, 144, 255, 0.5)",
      "oklch(0.65 0.15 253)",
    ];

    it.each(inGamutInputs)(
      "parse(formatColor(%s, f)) stays within 1/255 per rgb channel for every format",
      (input) => {
        const original = mustParse(input);
        const want = toRgb(original);
        for (const format of ["oklch", "hsl", "rgb", "hex"] as const) {
          const serialized = formatColor(original, format);
          const reparsed = parseColor(serialized);
          expect(reparsed.ok, `${format}: ${serialized}`).toBe(true);
          if (!reparsed.ok) continue;
          const got = toRgb(reparsed.color);
          expect(Math.abs(got.r - want.r), `${format} r`).toBeLessThanOrEqual(1 / 255);
          expect(Math.abs(got.g - want.g), `${format} g`).toBeLessThanOrEqual(1 / 255);
          expect(Math.abs(got.b - want.b), `${format} b`).toBeLessThanOrEqual(1 / 255);
          expect(
            Math.abs(getAlpha(reparsed.color) - getAlpha(original)),
            `${format} alpha`,
          ).toBeLessThanOrEqual(1 / 255);
        }
      },
    );
  });
});

describe("toSrgbSafe", () => {
  it("returns in-gamut colors unchanged", () => {
    const dodger = mustParse("#1e90ff");
    expect(toSrgbSafe(dodger)).toBe(dodger);
  });

  it("maps out-of-gamut colors into sRGB, preserving alpha", () => {
    const wide = mustParse("oklch(0.7 0.35 150 / 0.5)");
    const safe = toSrgbSafe(wide);
    const rgb = toRgb(safe);
    for (const ch of [rgb.r, rgb.g, rgb.b]) {
      expect(ch).toBeGreaterThanOrEqual(-1e-6);
      expect(ch).toBeLessThanOrEqual(1 + 1e-6);
    }
    expect(getAlpha(safe)).toBeCloseTo(0.5, 10);
  });
});

describe("toAllFormats", () => {
  it("returns the four formats in oklch, hsl, rgb, hex order with labels", () => {
    const entries = toAllFormats(mustParse("#1e90ff"));
    expect(entries.map((e) => e.format)).toEqual(["oklch", "hsl", "rgb", "hex"]);
    expect(entries.map((e) => e.label)).toEqual(["OKLCH", "HSL", "RGB", "HEX"]);
  });

  it("uses formatColor for each value", () => {
    const dodger80 = mustParse("#1e90ff80");
    const entries = toAllFormats(dodger80);
    expect(entries.map((e) => e.value)).toEqual([
      "oklch(0.652 0.1901 253.21 / 0.502)",
      "hsla(209.6, 100%, 55.9%, 0.502)",
      "rgba(30, 144, 255, 0.502)",
      "#1e90ff80",
    ]);
  });

  it("flags nothing as gamut-mapped for in-gamut colors", () => {
    const entries = toAllFormats(mustParse("#1e90ff"));
    expect(entries.map((e) => e.gamutMapped)).toEqual([false, false, false, false]);
  });

  it("flags only the sRGB-bound targets as gamut-mapped for wide colors", () => {
    const entries = toAllFormats(mustParse("oklch(0.7 0.35 150)"));
    expect(entries.map((e) => [e.format, e.gamutMapped])).toEqual([
      ["oklch", false],
      ["hsl", true],
      ["rgb", true],
      ["hex", true],
    ]);
  });
});

describe("toCss", () => {
  it("emits the hex serialization", () => {
    expect(toCss(mustParse("#1e90ff"))).toBe("#1e90ff");
    expect(toCss(mustParse("#1e90ff80"))).toBe("#1e90ff80");
  });

  it("emits gamut-mapped hex for wide colors", () => {
    expect(toCss(mustParse("oklch(0.7 0.35 150)"))).toBe("#00c248");
  });
});

describe("CSS Color 4 none components", () => {
  it("serializes oklch none components as 0, never NaN", () => {
    const color = mustParse("oklch(none 0.1 30)");
    expect(formatColor(color, "oklch")).toBe("oklch(0 0.1 30)");
    for (const f of toAllFormats(color)) {
      expect(f.value).not.toMatch(/NaN/);
    }
  });
});
