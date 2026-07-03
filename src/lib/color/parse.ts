import { converter, getMode, parse } from "culori";
import type { Color } from "culori";
import type { ColorFormat, ParseResult } from "./types";

const toRgb = converter("rgb");

/**
 * CSS Color 4 `none` components (e.g. `rgb(none 0 0)`) come out of culori as
 * absent channel properties, which would poison every downstream computation
 * with NaN. CSS specifies that `none` computes as 0, so fill missing
 * channels with 0 up front.
 */
function fillNoneChannels(color: Color): Color {
  const channels = getMode(color.mode)?.channels ?? [];
  const source = color as unknown as Record<string, unknown>;
  let filled: Record<string, unknown> | null = null;
  for (const channel of channels) {
    if (channel === "alpha") continue;
    if (source[channel] === undefined) {
      filled = filled ?? { ...source };
      filled[channel] = 0;
    }
  }
  return filled ? (filled as unknown as Color) : color;
}

/** Detect which of the four supported formats an input string uses, by syntax. */
export function detectFormat(input: string): ColorFormat | "other" {
  const s = input.trim().toLowerCase();
  if (s.startsWith("#")) return "hex";
  if (/^rgba?\(/.test(s)) return "rgb";
  if (/^hsla?\(/.test(s)) return "hsl";
  if (/^oklch\(/.test(s)) return "oklch";
  return "other";
}

/**
 * Format to re-serialize a UI draft into after a picker/slider commit, so
 * edits round-trip in the syntax the user typed; hex when unknown.
 */
export function draftFormat(input: string): ColorFormat {
  const f = detectFormat(input);
  return f === "other" ? "hex" : f;
}

export function parseColor(input: string): ParseResult {
  const s = input.trim();
  if (!s) return { ok: false, error: "Enter a color" };
  // CSS color syntax is case-insensitive, but culori's parse is strict
  // about lowercase function names (rgb/hsl/oklch).
  const color = parse(s.toLowerCase());
  if (!color) return { ok: false, error: "Unrecognized color" };
  return { ok: true, color: fillNoneChannels(color), sourceFormat: detectFormat(s) };
}

/**
 * Whether the color fits in sRGB. A small epsilon absorbs floating-point
 * noise from round-tripping through OKLCH so nominally-in-gamut colors
 * aren't flagged as out of gamut.
 */
export function isInSrgbGamut(color: Color, epsilon = 1e-6): boolean {
  const { r, g, b } = toRgb(color);
  return [r, g, b].every((ch) => ch >= -epsilon && ch <= 1 + epsilon);
}
