import type { Color } from "culori";
import { BLACK, flattenOver, getAlpha, toCss, WHITE } from "@/lib/color";
import { CopyButton } from "./CopyButton";
import { Swatch } from "./Swatch";

/**
 * Semi-transparent colors look different on every background — preview the
 * color over white, black, and a checkerboard, with the flattened result
 * ready to copy. Renders nothing for opaque colors.
 */
export function AlphaPreview({ color }: { color: Color }) {
  if (getAlpha(color) >= 1) return null;
  const css = toCss(color);
  const overWhite = toCss(flattenOver(color, WHITE));
  const overBlack = toCss(flattenOver(color, BLACK));

  return (
    <section aria-label="Alpha blending preview">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
        Alpha preview
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <figure>
          <Swatch css={css} className="h-20 rounded-lg border border-edge" />
          <figcaption className="mt-2 flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
              Checkerboard
            </span>
          </figcaption>
        </figure>
        <figure>
          <div
            className="h-20 rounded-lg border border-edge"
            style={{ background: overWhite }}
          />
          <figcaption className="mt-2 flex items-center justify-between gap-2">
            <span className="min-w-0 truncate font-mono text-[11px] text-muted">
              on white · {overWhite}
            </span>
            <CopyButton text={overWhite} label="Copy color flattened over white" />
          </figcaption>
        </figure>
        <figure>
          <div
            className="h-20 rounded-lg border border-edge"
            style={{ background: overBlack }}
          />
          <figcaption className="mt-2 flex items-center justify-between gap-2">
            <span className="min-w-0 truncate font-mono text-[11px] text-muted">
              on black · {overBlack}
            </span>
            <CopyButton text={overBlack} label="Copy color flattened over black" />
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
