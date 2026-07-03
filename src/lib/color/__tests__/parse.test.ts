import { describe, expect, it } from "vitest";
import { detectFormat, draftFormat, isInSrgbGamut, parseColor } from "@/lib/color";
import { mustParse } from "./helpers";

describe("parseColor", () => {
  describe("accepted inputs", () => {
    it.each([
      "#1e90ff",
      "#1e90ff80",
      "#abc",
      "#abcd",
      "rgb(30, 144, 255)",
      "rgba(30, 144, 255, 0.5)",
      "rgb(30 144 255 / 50%)",
      "hsl(209.6, 100%, 55.9%)",
      "hsla(209.6, 100%, 55.9%, 0.5)",
      "hsl(200 80% 50% / 0.5)",
      "oklch(0.7 0.15 230)",
      "oklch(0.7 0.15 230 / 0.5)",
      "dodgerblue",
      "rebeccapurple",
    ])("parses %s", (input) => {
      expect(parseColor(input).ok).toBe(true);
    });

    it("trims surrounding whitespace", () => {
      const result = parseColor("   #1e90ff   ");
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.sourceFormat).toBe("hex");
    });

    it("accepts uppercase hex digits", () => {
      expect(parseColor("#1E90FF").ok).toBe(true);
    });

    it("accepts mixed-case named colors", () => {
      expect(parseColor("DodgerBlue").ok).toBe(true);
    });

    it("accepts uppercase function syntax like RGB(30, 144, 255)", () => {
      expect(parseColor("RGB(30, 144, 255)").ok).toBe(true);
      expect(parseColor("HSLA(209.6, 100%, 55.9%, 0.5)").ok).toBe(true);
      expect(parseColor("OKLCH(0.7 0.15 230)").ok).toBe(true);
    });
  });

  describe("rejected inputs", () => {
    it("returns the empty-input error for an empty string", () => {
      expect(parseColor("")).toEqual({ ok: false, error: "Enter a color" });
    });

    it("returns the empty-input error for whitespace-only input", () => {
      expect(parseColor("   \t  ")).toEqual({ ok: false, error: "Enter a color" });
    });

    it("returns the unrecognized error for garbage", () => {
      expect(parseColor("notacolor")).toEqual({ ok: false, error: "Unrecognized color" });
    });

    it("returns the unrecognized error for malformed hex", () => {
      expect(parseColor("#zzzzzz")).toEqual({ ok: false, error: "Unrecognized color" });
    });

    it("returns the unrecognized error for a truncated function", () => {
      expect(parseColor("rgb(30, 144")).toEqual({ ok: false, error: "Unrecognized color" });
    });
  });

  describe("sourceFormat detection", () => {
    it.each([
      ["#1e90ff", "hex"],
      ["#1e90ff80", "hex"],
      ["rgb(30, 144, 255)", "rgb"],
      ["rgba(30, 144, 255, 0.5)", "rgb"],
      ["hsl(209.6, 100%, 55.9%)", "hsl"],
      ["hsla(209.6, 100%, 55.9%, 0.5)", "hsl"],
      ["oklch(0.7 0.15 230)", "oklch"],
      ["dodgerblue", "other"],
    ] as const)("%s -> %s", (input, expected) => {
      const result = parseColor(input);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.sourceFormat).toBe(expected);
    });
  });

  describe("parsed values", () => {
    it("produces the exact sRGB channels for #1e90ff", () => {
      const color = mustParse("#1e90ff");
      if (color.mode !== "rgb") throw new Error("expected hex to parse into rgb mode");
      expect(color.r).toBeCloseTo(30 / 255, 10);
      expect(color.g).toBeCloseTo(144 / 255, 10);
      expect(color.b).toBeCloseTo(255 / 255, 10);
    });

    it("reads the alpha byte from 8-digit hex", () => {
      const color = mustParse("#1e90ff80");
      expect(color.alpha).toBeCloseTo(128 / 255, 10);
    });

    it("leaves alpha undefined for opaque hex", () => {
      expect(mustParse("#1e90ff").alpha).toBeUndefined();
    });
  });
});

describe("detectFormat", () => {
  it.each([
    ["#1e90ff", "hex"],
    ["rgb(30, 144, 255)", "rgb"],
    ["rgba(30, 144, 255, 0.5)", "rgb"],
    ["hsl(210, 100%, 56%)", "hsl"],
    ["hsla(210, 100%, 56%, 0.5)", "hsl"],
    ["oklch(0.65 0.19 253)", "oklch"],
    ["dodgerblue", "other"],
    ["lab(50% 40 59.5)", "other"],
  ] as const)("detects %s as %s", (input, expected) => {
    expect(detectFormat(input)).toBe(expected);
  });

  it("is case-insensitive", () => {
    expect(detectFormat("RGB(30, 144, 255)")).toBe("rgb");
    expect(detectFormat("HSLA(210, 100%, 56%, 0.5)")).toBe("hsl");
    expect(detectFormat("OKLCH(0.65 0.19 253)")).toBe("oklch");
  });

  it("ignores surrounding whitespace", () => {
    expect(detectFormat("   #1e90ff   ")).toBe("hex");
    expect(detectFormat("  oklch(0.65 0.19 253)")).toBe("oklch");
  });

  it("is purely syntactic and does not validate the value", () => {
    expect(detectFormat("#notahexvalue")).toBe("hex");
    expect(detectFormat("rgb(garbage")).toBe("rgb");
  });
});

describe("isInSrgbGamut", () => {
  it("accepts ordinary sRGB colors", () => {
    expect(isInSrgbGamut(mustParse("#1e90ff"))).toBe(true);
    expect(isInSrgbGamut(mustParse("#000000"))).toBe(true);
    expect(isInSrgbGamut(mustParse("#ffffff"))).toBe(true);
  });

  it("accepts in-gamut colors expressed in oklch", () => {
    expect(isInSrgbGamut(mustParse("oklch(0.65 0.15 253)"))).toBe(true);
  });

  it("rejects wide-gamut oklch colors", () => {
    expect(isInSrgbGamut(mustParse("oklch(0.7 0.35 150)"))).toBe(false);
  });

  it("absorbs sub-epsilon floating-point overshoot by default", () => {
    expect(isInSrgbGamut({ mode: "rgb", r: 1 + 1e-7, g: 0.5, b: -1e-7 })).toBe(true);
  });

  it("rejects overshoot beyond the default epsilon", () => {
    expect(isInSrgbGamut({ mode: "rgb", r: 1.01, g: 0.5, b: 0.5 })).toBe(false);
    expect(isInSrgbGamut({ mode: "rgb", r: 0.5, g: 0.5, b: -0.01 })).toBe(false);
  });

  it("honours a custom epsilon", () => {
    expect(isInSrgbGamut({ mode: "rgb", r: 1.005, g: 0.5, b: 0.5 }, 0.01)).toBe(true);
    expect(isInSrgbGamut({ mode: "rgb", r: 1.005, g: 0.5, b: 0.5 }, 1e-4)).toBe(false);
  });
});

describe("draftFormat", () => {
  it.each([
    ["#1e90ff80", "hex"],
    ["rgba(30, 144, 255, 0.5)", "rgb"],
    ["hsl(120 100% 37%)", "hsl"],
    ["oklch(0.7 0.15 230)", "oklch"],
    ["dodgerblue", "hex"],
    ["", "hex"],
  ])("maps %j to %s", (input, expected) => {
    expect(draftFormat(input)).toBe(expected);
  });
});

describe("CSS Color 4 none components", () => {
  it("fills none channels with 0 so downstream math is NaN-free", () => {
    const color = mustParse("rgb(none 0 0)");
    if (color.mode !== "rgb") throw new Error("expected rgb mode");
    expect(color.r).toBe(0);
    expect(color.g).toBe(0);
    expect(color.b).toBe(0);
  });

  it("keeps a black-with-none inside the sRGB gamut", () => {
    expect(isInSrgbGamut(mustParse("rgb(none 0 0)"))).toBe(true);
  });
});
