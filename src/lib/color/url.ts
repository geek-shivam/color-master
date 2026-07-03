import { parse } from "culori";
import type { Color } from "culori";
import { formatColor } from "./format";

/** 3/4/6/8-digit bare hex (no `#`), the only shape we accept from a URL. */
const HEX_PARAM = /^(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/;

/**
 * Encode a color as bare lowercase hex for URL params: 6 digits when opaque,
 * 8 when translucent. Out-of-sRGB colors are gamut-mapped first (lossy by
 * design) — exactly the hex serialization, minus the `#`.
 */
export function encodeColorParam(color: Color): string {
  return formatColor(color, "hex").slice(1);
}

export function decodeColorParam(param: string): Color | null {
  const p = param.trim().toLowerCase();
  if (!HEX_PARAM.test(p)) return null;
  return parse(`#${p}`) ?? null;
}

export function encodeCompareState(
  base: Color | null,
  comparisons: Color[],
): { b: string | null; c: string | null } {
  return {
    b: base ? encodeColorParam(base) : null,
    c: comparisons.length ? comparisons.map(encodeColorParam).join(",") : null,
  };
}

export function decodeCompareState(
  b: string | null,
  c: string | null,
): { base: Color | null; comparisons: Color[] } {
  return {
    base: b ? decodeColorParam(b) : null,
    comparisons: c
      ? c
          .split(",")
          .map(decodeColorParam)
          .filter((color): color is Color => color !== null)
      : [],
  };
}
