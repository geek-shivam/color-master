import type { Color } from "culori";
import { parseColor } from "@/lib/color";

/** Parse an input the engine is known to accept, throwing on failure so tests stay terse. */
export function mustParse(input: string): Color {
  const result = parseColor(input);
  if (!result.ok) throw new Error(`expected "${input}" to parse, got error: ${result.error}`);
  return result.color;
}
