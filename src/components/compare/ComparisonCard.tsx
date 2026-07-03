"use client";

import type { Color } from "culori";
import { useState } from "react";
import { BackdropToggle } from "@/components/BackdropToggle";
import { ColorInput } from "@/components/ColorInput";
import { FormatRow } from "@/components/FormatRow";
import { BACKDROP_CLASS, Swatch, type Backdrop } from "@/components/Swatch";
import {
  BLACK,
  WHITE,
  compareColors,
  describeDeltaE,
  toAllFormats,
  toCss,
} from "@/lib/color";
import { WcagBadge } from "./WcagBadge";

// Displayed values truncate (floor) rather than round so a shown value never
// overstates the raw one — "4.50:1" on screen always means the AA threshold
// really was met, and the badges can't contradict the number beside them.
const floorFixed = (n: number, dp: number): string => {
  const factor = 10 ** dp;
  return (Math.floor(n * factor) / factor).toFixed(dp);
};

interface ComparisonCardProps {
  base: Color;
  index: number;
  draft: string;
  error: string | null;
  color: Color | null;
  onDraftChange: (text: string) => void;
  onCommit: (color: Color, opts?: { debounceMs?: number }) => void;
  onRemove: () => void;
}

export function ComparisonCard({
  base,
  index,
  draft,
  error,
  color,
  onDraftChange,
  onCommit,
  onRemove,
}: ComparisonCardProps) {
  const [backdrop, setBackdrop] = useState<Backdrop>("checker");
  // Metrics need a flat backdrop; the checkerboard is a visual device only.
  const metricBackdrop = backdrop === "black" ? BLACK : WHITE;
  const result = color ? compareColors(base, color, metricBackdrop) : null;

  return (
    <article
      className="rounded-xl border border-edge bg-surface p-4"
      aria-label={`Comparison ${index + 1}`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="flex items-center gap-2">
          <BackdropToggle value={backdrop} onChange={setBackdrop} />
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove comparison ${index + 1}`}
            className="rounded px-1.5 py-0.5 text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-foreground"
          >
            ✕
          </button>
        </div>
      </div>

      <ColorInput
        id={`compare-input-${index}`}
        label="Color"
        draft={draft}
        error={error}
        currentColor={color}
        onDraftChange={onDraftChange}
        onCommit={onCommit}
      />

      {color && result && (
        <div className={`transition-opacity ${error ? "opacity-40" : ""}`}>
          <div className="mt-4 flex gap-2">
            <div className="flex h-14 flex-1 overflow-hidden rounded-lg border border-edge">
              <Swatch css={toCss(base)} backdrop={backdrop} className="h-full flex-1" />
              <Swatch css={toCss(color)} backdrop={backdrop} className="h-full flex-1" />
            </div>
            <div
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-edge ${BACKDROP_CLASS[backdrop]}`}
              title="Comparison as text on the base color, over the selected backdrop"
            >
              <div
                className="flex h-full w-full items-center justify-center"
                style={{ backgroundColor: toCss(base) }}
              >
                <span
                  aria-hidden
                  className="text-lg font-semibold"
                  style={{ color: toCss(color) }}
                >
                  Aa
                </span>
              </div>
            </div>
          </div>

          <dl className="mt-4 space-y-2 font-mono text-sm">
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-[11px] uppercase tracking-[0.15em] text-muted">
                ΔE2000
              </dt>
              <dd>
                {floorFixed(result.deltaE, 2)}{" "}
                <span className="text-muted">· {describeDeltaE(result.deltaE)}</span>
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-[11px] uppercase tracking-[0.15em] text-muted">
                OKLCH Δ
              </dt>
              <dd>{result.oklchDistance.toFixed(3)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-[11px] uppercase tracking-[0.15em] text-muted">
                Contrast
              </dt>
              <dd>{floorFixed(result.wcag.ratio, 2)}:1</dd>
            </div>
          </dl>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <WcagBadge level="AA" variant="normal" pass={result.wcag.aaNormal} />
            <WcagBadge level="AA" variant="large" pass={result.wcag.aaLarge} />
            <WcagBadge level="AAA" variant="normal" pass={result.wcag.aaaNormal} />
            <WcagBadge level="AAA" variant="large" pass={result.wcag.aaaLarge} />
          </div>

          <div className="mt-4 divide-y divide-edge border-t border-edge">
            {toAllFormats(color).map((f) => (
              <FormatRow
                key={f.format}
                label={f.label}
                value={f.value}
                gamutMapped={f.gamutMapped}
              />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
