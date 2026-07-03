import { converter } from "culori";
import { describe, expect, it } from "vitest";
import {
  decodeColorParam,
  decodeCompareState,
  encodeColorParam,
  encodeCompareState,
  getAlpha,
} from "@/lib/color";
import { mustParse } from "./helpers";

const toRgb = converter("rgb");

describe("encodeColorParam", () => {
  it("encodes an opaque color as bare lowercase 6-digit hex", () => {
    expect(encodeColorParam(mustParse("#1e90ff"))).toBe("1e90ff");
  });

  it("encodes named colors through their sRGB value", () => {
    expect(encodeColorParam(mustParse("dodgerblue"))).toBe("1e90ff");
  });

  it("encodes translucent colors as 8-digit hex", () => {
    expect(encodeColorParam(mustParse("#1e90ff80"))).toBe("1e90ff80");
  });

  it("encodes a fully transparent color with a 00 alpha byte", () => {
    expect(encodeColorParam(mustParse("rgba(30, 144, 255, 0)"))).toBe("1e90ff00");
  });

  it("gamut-maps out-of-sRGB colors before encoding (6 digits when opaque)", () => {
    const param = encodeColorParam(mustParse("oklch(0.7 0.35 150)"));
    expect(param).toMatch(/^[0-9a-f]{6}$/);
    // Independently computed CSS4 mapping of oklch(0.7 0.35 150) -> #00c248
    expect(param).toBe("00c248");
  });
});

describe("decodeColorParam", () => {
  it("decodes 6-digit hex", () => {
    const color = decodeColorParam("1e90ff");
    expect(color).not.toBeNull();
    const rgb = toRgb(color!);
    expect(rgb.r).toBeCloseTo(30 / 255, 10);
    expect(rgb.g).toBeCloseTo(144 / 255, 10);
    expect(rgb.b).toBeCloseTo(255 / 255, 10);
  });

  it("decodes 8-digit hex with alpha", () => {
    const color = decodeColorParam("1e90ff80");
    expect(color).not.toBeNull();
    expect(getAlpha(color!)).toBeCloseTo(128 / 255, 10);
  });

  it("decodes 3-digit shorthand by doubling each digit", () => {
    const color = decodeColorParam("abc");
    expect(color).not.toBeNull();
    const rgb = toRgb(color!);
    expect(rgb.r).toBeCloseTo(170 / 255, 10); // aa
    expect(rgb.g).toBeCloseTo(187 / 255, 10); // bb
    expect(rgb.b).toBeCloseTo(204 / 255, 10); // cc
  });

  it("decodes 4-digit shorthand including the alpha digit", () => {
    const color = decodeColorParam("abcd");
    expect(color).not.toBeNull();
    expect(getAlpha(color!)).toBeCloseTo(221 / 255, 10); // dd
  });

  it("is case-insensitive", () => {
    expect(decodeColorParam("1E90FF")).not.toBeNull();
  });

  it("trims surrounding whitespace", () => {
    expect(decodeColorParam("  1e90ff  ")).not.toBeNull();
  });

  it.each([
    ["#1e90ff", "hash-prefixed"],
    ["1e90f", "5 digits"],
    ["1e90ff8", "7 digits"],
    ["1e90ff800", "9 digits"],
    ["zzzzzz", "non-hex characters"],
    ["", "empty string"],
    ["1e90ff,ff0000", "comma-joined pair"],
    ["rgb(30, 144, 255)", "css syntax"],
  ])("rejects %s (%s)", (input) => {
    expect(decodeColorParam(input)).toBeNull();
  });
});

describe("encodeCompareState", () => {
  it("returns nulls when there is no state", () => {
    expect(encodeCompareState(null, [])).toEqual({ b: null, c: null });
  });

  it("encodes the base alone, with c null for no comparisons", () => {
    expect(encodeCompareState(mustParse("#1e90ff"), [])).toEqual({
      b: "1e90ff",
      c: null,
    });
  });

  it("comma-joins encoded comparisons", () => {
    expect(
      encodeCompareState(mustParse("#1e90ff"), [mustParse("#ff0000"), mustParse("#00ff0080")]),
    ).toEqual({ b: "1e90ff", c: "ff0000,00ff0080" });
  });
});

describe("decodeCompareState", () => {
  it("returns an empty state for null params", () => {
    expect(decodeCompareState(null, null)).toEqual({ base: null, comparisons: [] });
  });

  it("drops invalid entries but keeps order", () => {
    const { base, comparisons } = decodeCompareState("1e90ff", "ff0000,zzz,00ff0080");
    expect(base).not.toBeNull();
    expect(comparisons).toHaveLength(2);

    const first = toRgb(comparisons[0]);
    expect(first.r).toBeCloseTo(1, 10);
    expect(first.g).toBeCloseTo(0, 10);
    expect(first.b).toBeCloseTo(0, 10);

    const second = toRgb(comparisons[1]);
    expect(second.r).toBeCloseTo(0, 10);
    expect(second.g).toBeCloseTo(1, 10);
    expect(second.b).toBeCloseTo(0, 10);
    expect(getAlpha(comparisons[1])).toBeCloseTo(128 / 255, 10);
  });

  it("returns a null base when the base param is invalid", () => {
    const { base, comparisons } = decodeCompareState("nope", "ff0000");
    expect(base).toBeNull();
    expect(comparisons).toHaveLength(1);
  });
});

describe("encode/decode identity", () => {
  it.each([
    "#1e90ff",
    "#1e90ff80",
    "rgba(255, 0, 0, 0.25)",
    "#abcdef",
    "hsl(300, 40%, 60%)",
    "oklch(0.65 0.15 253 / 0.5)",
  ])("decode(encode(%s)) preserves channels and alpha within 1/255", (input) => {
    const original = mustParse(input);
    const decoded = decodeColorParam(encodeColorParam(original));
    expect(decoded).not.toBeNull();
    const want = toRgb(original);
    const got = toRgb(decoded!);
    expect(Math.abs(got.r - want.r)).toBeLessThanOrEqual(1 / 255);
    expect(Math.abs(got.g - want.g)).toBeLessThanOrEqual(1 / 255);
    expect(Math.abs(got.b - want.b)).toBeLessThanOrEqual(1 / 255);
    expect(Math.abs(getAlpha(decoded!) - getAlpha(original))).toBeLessThanOrEqual(1 / 255);
  });
});
