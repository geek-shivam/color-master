import { differenceCiede2000, differenceEuclidean } from "culori";
import type { Color } from "culori";
import { WHITE } from "./alpha";
import { evaluateWcag, opaqueOver } from "./contrast";
import type { ComparisonResult } from "./types";

const ciede2000 = differenceCiede2000();
const okDistance = differenceEuclidean("oklch");

/**
 * Difference metrics use the same flattening rule as contrast: both colors
 * are gamut-mapped, composited over the same opaque backdrop (white by
 * default) and then compared side by side, so alpha differences register in
 * every metric and the numbers match what actually renders.
 */
function flattenPair(base: Color, comparison: Color, backdrop: Color): [Color, Color] {
  return [opaqueOver(base, backdrop), opaqueOver(comparison, backdrop)];
}

export function deltaE2000(
  base: Color,
  comparison: Color,
  backdrop: Color = WHITE,
): number {
  const [a, b] = flattenPair(base, comparison, backdrop);
  return ciede2000(a, b);
}

export function oklchDistance(
  base: Color,
  comparison: Color,
  backdrop: Color = WHITE,
): number {
  const [a, b] = flattenPair(base, comparison, backdrop);
  return okDistance(a, b);
}

export function describeDeltaE(d: number): string {
  if (d < 1) return "imperceptible";
  if (d < 2) return "barely perceptible";
  if (d < 10) return "noticeable";
  if (d < 49) return "distinct";
  return "different";
}

export function compareColors(
  base: Color,
  comparison: Color,
  backdrop: Color = WHITE,
): ComparisonResult {
  return {
    deltaE: deltaE2000(base, comparison, backdrop),
    oklchDistance: oklchDistance(base, comparison, backdrop),
    wcag: evaluateWcag(comparison, base, backdrop),
  };
}
