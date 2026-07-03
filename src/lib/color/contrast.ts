import { clampRgb, wcagContrast } from "culori";
import type { Color, Rgb } from "culori";
import { flattenOver, WHITE } from "./alpha";
import { toSrgbSafe } from "./format";
import type { WcagResult } from "./types";

export const WCAG = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3,
  AAA_NORMAL: 7,
  AAA_LARGE: 4.5,
} as const;

/**
 * WCAG 2.1 contrast between a foreground and background. WCAG defines
 * contrast only for opaque colors, so semi-transparent inputs are flattened
 * first: each color is composited over the same opaque backdrop (white by
 * default), then the ratio is computed on the flattened pair. This keeps
 * alpha differences visible — a translucent copy of a color no longer
 * "disappears into" its opaque twin.
 *
 * Colors are gamut-mapped into sRGB first so the numbers describe the colors
 * as they actually render on screen, not the raw out-of-gamut values.
 */
export function opaqueOver(color: Color, backdrop: Color): Rgb {
  return clampRgb(flattenOver(toSrgbSafe(color), toSrgbSafe(backdrop)));
}

export function contrastRatio(fg: Color, bg: Color, backdrop: Color = WHITE): number {
  return wcagContrast(opaqueOver(fg, backdrop), opaqueOver(bg, backdrop));
}

export function evaluateWcag(fg: Color, bg: Color, backdrop: Color = WHITE): WcagResult {
  const ratio = contrastRatio(fg, bg, backdrop);
  return {
    ratio,
    aaNormal: ratio >= WCAG.AA_NORMAL,
    aaLarge: ratio >= WCAG.AA_LARGE,
    aaaNormal: ratio >= WCAG.AAA_NORMAL,
    aaaLarge: ratio >= WCAG.AAA_LARGE,
  };
}
