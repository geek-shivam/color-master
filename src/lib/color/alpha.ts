import { converter } from "culori";
import type { Color, Rgb } from "culori";

const toRgb = converter("rgb");

export const WHITE: Rgb = { mode: "rgb", r: 1, g: 1, b: 1 };
export const BLACK: Rgb = { mode: "rgb", r: 0, g: 0, b: 0 };

/** Alpha of a culori color; absent alpha means fully opaque. Clamped to [0, 1]. */
export function getAlpha(color: Color): number {
  return Math.min(1, Math.max(0, color.alpha ?? 1));
}

/** Return `color` with the given alpha applied (omitted entirely when opaque). */
export function withAlpha(color: Color, alpha: number): Color {
  const a = Math.min(1, Math.max(0, alpha));
  if (a >= 1) {
    const rest = { ...color };
    delete rest.alpha;
    return rest;
  }
  return { ...color, alpha: a };
}

/**
 * Source-over compositing in gamma-encoded sRGB, matching how browsers
 * composite CSS colors. The backdrop is treated as opaque; the result is opaque.
 */
export function flattenOver(fg: Color, bg: Color): Rgb {
  const f = toRgb(fg);
  const b = toRgb(bg);
  const a = getAlpha(fg);
  return {
    mode: "rgb",
    r: f.r * a + b.r * (1 - a),
    g: f.g * a + b.g * (1 - a),
    b: f.b * a + b.b * (1 - a),
    alpha: 1,
  };
}
