"use client";

import { parse } from "culori";
import type { Color } from "culori";
import { useEyeDropper } from "@/hooks/useEyeDropper";
import { formatColor, getAlpha, toCss, withAlpha } from "@/lib/color";

interface ColorInputProps {
  id: string;
  label: string;
  draft: string;
  error?: string | null;
  currentColor: Color | null;
  onDraftChange: (text: string) => void;
  /** Called with an already-valid color from the picker, eyedropper or alpha slider. */
  onCommit: (color: Color, opts?: { debounceMs?: number }) => void;
}

export function ColorInput({
  id,
  label,
  draft,
  error,
  currentColor,
  onDraftChange,
  onCommit,
}: ColorInputProps) {
  const { supported, open } = useEyeDropper();

  // Native pickers speak 6-digit hex only; re-apply the slot's alpha on pick.
  const opaqueHex = currentColor
    ? formatColor(withAlpha(currentColor, 1), "hex")
    : "#000000";
  const alpha = currentColor ? getAlpha(currentColor) : 1;

  // Native picker drags fire change events continuously — debounce the URL
  // write (Safari hard-throttles rapid history.replaceState calls). The
  // picker can't express alpha, so the slot's alpha is preserved.
  const applyPicked = (hex: string) => {
    const picked = parse(hex);
    if (!picked) return;
    onCommit(withAlpha(picked, currentColor ? getAlpha(currentColor) : 1), {
      debounceMs: 250,
    });
  };

  // The eyedropper samples an actual screen pixel, so forward it faithfully
  // (opaque) — re-applying the slot's alpha would show a color the user
  // never picked. The alpha slider can re-apply transparency afterwards.
  const applyEyedropped = (hex: string) => {
    const picked = parse(hex);
    if (!picked) return;
    onCommit(picked);
  };

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.15em] text-muted"
      >
        {label}
      </label>
      <div
        className={`flex items-center gap-2 rounded-lg border bg-surface px-3 py-2.5 transition-colors ${
          error ? "border-red-500/70" : "border-edge focus-within:border-muted"
        }`}
      >
        <input
          id={id}
          type="text"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          placeholder="oklch(0.7 0.15 230 / 0.5)"
          className="min-w-0 flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-muted/50"
        />
        <label
          className="relative h-6 w-6 shrink-0 cursor-pointer overflow-hidden rounded border border-edge focus-within:outline-2 focus-within:outline-foreground"
          title="Open color picker"
        >
          <span className="checkerboard absolute inset-0">
            <span
              className="absolute inset-0"
              style={{ background: currentColor ? toCss(currentColor) : "transparent" }}
            />
          </span>
          <input
            type="color"
            value={opaqueHex}
            onChange={(e) => applyPicked(e.target.value)}
            aria-label={`${label} — open color picker`}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        {supported && (
          <button
            type="button"
            onClick={async () => {
              const hex = await open();
              if (hex) applyEyedropped(hex);
            }}
            aria-label="Pick a color from the screen"
            title="Pick from screen"
            className="shrink-0 rounded border border-edge p-1 text-muted transition-colors hover:border-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-foreground"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="m2 22 1-1h3l9-9" />
              <path d="M3 21v-3l9-9" />
              <path d="m15 6 3.3-3.3a2.4 2.4 0 0 1 3.4 3.4L18.4 9.4 15 6Z" />
              <path d="m11.5 9.5 3 3" />
            </svg>
          </button>
        )}
      </div>
      {currentColor && (
        <div className="mt-2 flex items-center gap-3">
          <span className="w-14 shrink-0 font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
            Alpha
          </span>
          <div className="relative flex h-4 min-w-0 flex-1 items-center">
            <div className="checkerboard h-3 w-full overflow-hidden rounded-full border border-edge">
              <div
                className="h-full w-full"
                style={{
                  background: `linear-gradient(to right, transparent, ${opaqueHex})`,
                }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={alpha}
              onChange={(e) =>
                onCommit(withAlpha(currentColor, Number(e.target.value)), {
                  debounceMs: 250,
                })
              }
              aria-label={`${label} — alpha`}
              className="alpha-slider absolute inset-0 h-full w-full"
            />
          </div>
          <span className="w-9 shrink-0 text-right font-mono text-xs tabular-nums">
            {alpha.toFixed(2)}
          </span>
        </div>
      )}
      {error ? (
        <p className="mt-1.5 font-mono text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
