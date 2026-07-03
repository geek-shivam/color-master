import { clampRgb, converter, formatHex, formatHex8, toGamut } from "culori";
import type { Color } from "culori";
import { getAlpha, withAlpha } from "./alpha";
import { isInSrgbGamut } from "./parse";
import { fmtNum } from "./round";
import type { ColorFormat, FormattedColor } from "./types";

const toOklch = converter("oklch");
const toHsl = converter("hsl");
const toRgb = converter("rgb");
const mapToSrgb = toGamut("rgb", "oklch");

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const normalizeHue = (h: number) => ((h % 360) + 360) % 360;

/** CSS Color 4 gamut mapping into sRGB (chroma reduction in OKLCH), alpha preserved. */
export function toSrgbSafe(color: Color): Color {
  if (isInSrgbGamut(color)) return color;
  return withAlpha(mapToSrgb(color), getAlpha(color));
}

function serializeOklch(color: Color): string {
  const { l, c, h } = toOklch(color);
  const a = getAlpha(color);
  const base = `oklch(${fmtNum(clamp01(l), 4)} ${fmtNum(Math.max(0, c), 4)} ${fmtNum(normalizeHue(h ?? 0), 2)}`;
  return a < 1 ? `${base} / ${fmtNum(a, 3)})` : `${base})`;
}

function serializeHsl(color: Color): string {
  const { h, s, l } = toHsl(clampRgb(toRgb(color)));
  const a = getAlpha(color);
  const hue = fmtNum(normalizeHue(h ?? 0), 1);
  const sat = fmtNum(clamp01(s) * 100, 1);
  const lig = fmtNum(clamp01(l) * 100, 1);
  return a < 1
    ? `hsla(${hue}, ${sat}%, ${lig}%, ${fmtNum(a, 3)})`
    : `hsl(${hue}, ${sat}%, ${lig}%)`;
}

function serializeRgb(color: Color): string {
  const { r, g, b } = clampRgb(toRgb(color));
  const a = getAlpha(color);
  const bytes = [r, g, b].map((ch) => Math.round(clamp01(ch) * 255));
  return a < 1
    ? `rgba(${bytes[0]}, ${bytes[1]}, ${bytes[2]}, ${fmtNum(a, 3)})`
    : `rgb(${bytes[0]}, ${bytes[1]}, ${bytes[2]})`;
}

function serializeHex(color: Color): string {
  const rgb = clampRgb(toRgb(color));
  return getAlpha(color) < 1 ? formatHex8(rgb) : formatHex(rgb);
}

/**
 * Serialize into one of the four supported formats. sRGB-bound targets
 * (hsl, rgb, hex) are gamut-mapped first; the oklch target serializes the
 * original color so OKLCH inputs round-trip faithfully.
 */
export function formatColor(color: Color, format: ColorFormat): string {
  switch (format) {
    case "oklch":
      return serializeOklch(color);
    case "hsl":
      return serializeHsl(toSrgbSafe(color));
    case "rgb":
      return serializeRgb(toSrgbSafe(color));
    case "hex":
      return serializeHex(toSrgbSafe(color));
  }
}

const FORMAT_LABELS: Record<ColorFormat, string> = {
  oklch: "OKLCH",
  hsl: "HSL",
  rgb: "RGB",
  hex: "HEX",
};

export function toAllFormats(color: Color): FormattedColor[] {
  const gamutMapped = !isInSrgbGamut(color);
  return (["oklch", "hsl", "rgb", "hex"] as const).map((format) => ({
    format,
    label: FORMAT_LABELS[format],
    value: formatColor(color, format),
    gamutMapped: format !== "oklch" && gamutMapped,
  }));
}

/** CSS-ready string for swatches/previews (hex8 renders in every modern browser). */
export function toCss(color: Color): string {
  return formatColor(color, "hex");
}
