import type { Color } from "culori";

export type ColorFormat = "oklch" | "hsl" | "rgb" | "hex";

export type ParseResult =
  | { ok: true; color: Color; sourceFormat: ColorFormat | "other" }
  | { ok: false; error: string };

export interface FormattedColor {
  format: ColorFormat;
  label: string;
  value: string;
  gamutMapped: boolean;
}

export interface WcagResult {
  ratio: number;
  aaNormal: boolean;
  aaLarge: boolean;
  aaaNormal: boolean;
  aaaLarge: boolean;
}

export interface ComparisonResult {
  deltaE: number;
  oklchDistance: number;
  wcag: WcagResult;
}
