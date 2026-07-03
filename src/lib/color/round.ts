/** Round half-away-from-zero to `dp` decimal places. */
export function roundTo(n: number, dp: number): number {
  const factor = 10 ** dp;
  const rounded = (Math.sign(n) * Math.round(Math.abs(n) * factor)) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
}

/** Format a number with at most `dp` decimals, trailing zeros trimmed. */
export function fmtNum(n: number, dp: number): string {
  return roundTo(n, dp).toString();
}
