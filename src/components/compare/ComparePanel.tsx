"use client";

import type { Color } from "culori";
import { useCallback, useEffect, useState } from "react";
import { BackdropToggle } from "@/components/BackdropToggle";
import { ColorInput } from "@/components/ColorInput";
import { FormatRow } from "@/components/FormatRow";
import { Swatch, type Backdrop } from "@/components/Swatch";
import { useUrlParams } from "@/hooks/useUrlColorState";
import {
  decodeCompareState,
  draftFormat,
  encodeCompareState,
  formatColor,
  parseColor,
  toAllFormats,
  toCss,
} from "@/lib/color";
import { ComparisonCard } from "./ComparisonCard";

interface Slot {
  id: number;
  draft: string;
  color: Color | null;
  error: string | null;
  /** Per-card backdrop override; null follows the base (page-wide) toggle. */
  backdrop: Backdrop | null;
}

interface State {
  baseDraft: string;
  base: Color | null;
  baseError: string | null;
  slots: Slot[];
}

const DEFAULT_BASE = "#1e90ff";
const DEFAULT_COMPARISONS = ["#ffffff", "#111111"];

const committedColors = (slots: Slot[]): Color[] =>
  slots.map((s) => s.color).filter((c): c is Color => c !== null);

// Slot keys only need uniqueness; a module counter keeps render pure of refs.
let nextSlotId = 0;
const newSlot = (draft: string, color: Color | null): Slot => ({
  id: nextSlotId++,
  draft,
  color,
  error: null,
  backdrop: null,
});

function makeDefaultState(): State {
  const seededBase = parseColor(DEFAULT_BASE);
  return {
    baseDraft: DEFAULT_BASE,
    base: seededBase.ok ? seededBase.color : null,
    baseError: null,
    slots: DEFAULT_COMPARISONS.map((d) => {
      const r = parseColor(d);
      return newSlot(d, r.ok ? r.color : null);
    }),
  };
}

export function ComparePanel() {
  const { params, setParams, isOwnUrl } = useUrlParams();
  const [baseBackdrop, setBaseBackdrop] = useState<Backdrop>("checker");

  const [state, setState] = useState<State>(() => {
    const decoded = decodeCompareState(params.get("b"), params.get("c"));
    if (decoded.base) {
      return {
        baseDraft: formatColor(decoded.base, "hex"),
        base: decoded.base,
        baseError: null,
        slots: decoded.comparisons.map((c) => newSlot(formatColor(c, "hex"), c)),
      };
    }
    return makeDefaultState();
  });
  const { baseDraft, base, baseError, slots } = state;

  const syncUrl = useCallback(
    (nextBase: Color | null, nextSlots: Slot[], debounceMs = 0) => {
      const { b, c } = encodeCompareState(nextBase, committedColors(nextSlots));
      setParams({ b, c }, { debounceMs });
    },
    [setParams],
  );

  // Resync when the URL changes underneath us (back/forward, pasted link,
  // nav to the bare route). Render-time adjust pattern: the hook flags its
  // own canonical writes; external changes rebuild state, and a removed
  // base resets to the default so the URL never lies.
  const urlB = params.get("b");
  const urlC = params.get("c");
  const [lastUrl, setLastUrl] = useState({ b: urlB, c: urlC });
  if (urlB !== lastUrl.b || urlC !== lastUrl.c) {
    setLastUrl({ b: urlB, c: urlC });
    if (!isOwnUrl(params)) {
      if (urlB === null) {
        setState(makeDefaultState());
      } else {
        const decoded = decodeCompareState(urlB, urlC);
        if (decoded.base) {
          setState({
            baseDraft: formatColor(decoded.base, "hex"),
            base: decoded.base,
            baseError: null,
            slots: decoded.comparisons.map((col) =>
              newSlot(formatColor(col, "hex"), col),
            ),
          });
        }
      }
    }
  }

  // Signature: the app wears the base color.
  useEffect(() => {
    if (base) {
      document.documentElement.style.setProperty("--accent", toCss(base));
    }
  }, [base]);

  const handleBaseDraft = (text: string) => {
    const result = parseColor(text);
    if (result.ok) {
      setState((prev) => ({
        ...prev,
        baseDraft: text,
        base: result.color,
        baseError: null,
      }));
      syncUrl(result.color, slots, 250);
    } else {
      // Always surface why the base doesn't parse, including when cleared.
      setState((prev) => ({
        ...prev,
        baseDraft: text,
        baseError: result.error,
      }));
    }
  };

  const handleBaseCommit = (color: Color, opts?: { debounceMs?: number }) => {
    setState((prev) => ({
      ...prev,
      baseDraft: formatColor(color, draftFormat(prev.baseDraft)),
      base: color,
      baseError: null,
    }));
    syncUrl(color, slots, opts?.debounceMs ?? 0);
  };

  const handleSlotDraft = (id: number, text: string) => {
    // Clearing the field empties the slot: the color leaves the card and the
    // URL rather than lingering as invisible stale state.
    if (!text.trim()) {
      const nextSlots = slots.map((s) =>
        s.id === id ? { ...s, draft: text, color: null, error: null } : s,
      );
      setState((prev) => ({ ...prev, slots: nextSlots }));
      syncUrl(base, nextSlots);
      return;
    }
    const result = parseColor(text);
    const nextSlots = slots.map((s) =>
      s.id !== id
        ? s
        : result.ok
          ? { ...s, draft: text, color: result.color, error: null }
          : { ...s, draft: text, error: result.error },
    );
    setState((prev) => ({ ...prev, slots: nextSlots }));
    if (result.ok) syncUrl(base, nextSlots, 250);
  };

  const handleSlotCommit = (
    id: number,
    color: Color,
    opts?: { debounceMs?: number },
  ) => {
    const nextSlots = slots.map((s) =>
      s.id === id
        ? { ...s, draft: formatColor(color, draftFormat(s.draft)), color, error: null }
        : s,
    );
    setState((prev) => ({ ...prev, slots: nextSlots }));
    syncUrl(base, nextSlots, opts?.debounceMs ?? 0);
  };

  // The base toggle is the page-wide backdrop: it restyles the base band and
  // resets every card to follow it. A card's own toggle overrides it for that
  // card until the base toggle changes again.
  const handleBaseBackdrop = (backdrop: Backdrop) => {
    setBaseBackdrop(backdrop);
    setState((prev) => ({
      ...prev,
      slots: prev.slots.map((s) => ({ ...s, backdrop: null })),
    }));
  };

  const handleSlotBackdrop = (id: number, backdrop: Backdrop) => {
    setState((prev) => ({
      ...prev,
      slots: prev.slots.map((s) => (s.id === id ? { ...s, backdrop } : s)),
    }));
  };

  const addSlot = () => {
    // Nothing committed yet, so the URL is untouched until the color parses.
    setState((prev) => ({ ...prev, slots: [...prev.slots, newSlot("", null)] }));
  };

  const removeSlot = (id: number) => {
    const nextSlots = slots.filter((s) => s.id !== id);
    setState((prev) => ({ ...prev, slots: nextSlots }));
    syncUrl(base, nextSlots);
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="sr-only">Color comparison</h1>

      <section aria-label="Base color" className="max-w-2xl">
        <ColorInput
          id="base-input"
          label="Base color"
          draft={baseDraft}
          error={baseError}
          currentColor={base}
          onDraftChange={handleBaseDraft}
          onCommit={handleBaseCommit}
        />
        {base && (
          <>
            <div className="mt-4 flex items-center gap-3">
              <Swatch
                css={toCss(base)}
                backdrop={baseBackdrop}
                inset
                className="h-16 min-w-0 flex-1 rounded-xl border border-edge"
              />
              <BackdropToggle value={baseBackdrop} onChange={handleBaseBackdrop} />
            </div>
            <div className="mt-2 divide-y divide-edge border-b border-edge">
              {toAllFormats(base).map((f) => (
                <FormatRow
                  key={f.format}
                  label={f.label}
                  value={f.value}
                  gamutMapped={f.gamutMapped}
                />
              ))}
            </div>
          </>
        )}
      </section>

      <section aria-label="Comparison colors" className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
            Against base · {slots.length} color{slots.length === 1 ? "" : "s"}
          </h2>
          <button
            type="button"
            onClick={addSlot}
            className="rounded-lg border border-edge bg-surface px-3 py-2 font-mono text-xs uppercase tracking-[0.1em] transition-colors hover:border-muted focus-visible:outline-2 focus-visible:outline-foreground"
          >
            + Add color
          </button>
        </div>

        {!base ? (
          <p className="rounded-xl border border-dashed border-edge p-8 text-center font-mono text-sm text-muted">
            Set a valid base color to start comparing.
          </p>
        ) : slots.length === 0 ? (
          <p className="rounded-xl border border-dashed border-edge p-8 text-center font-mono text-sm text-muted">
            Add a color to compare it against the base.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {slots.map((slot, i) => (
              <ComparisonCard
                key={slot.id}
                base={base}
                index={i}
                draft={slot.draft}
                error={slot.error}
                color={slot.color}
                backdrop={slot.backdrop ?? baseBackdrop}
                onBackdropChange={(backdrop) => handleSlotBackdrop(slot.id, backdrop)}
                onDraftChange={(text) => handleSlotDraft(slot.id, text)}
                onCommit={(color, opts) => handleSlotCommit(slot.id, color, opts)}
                onRemove={() => removeSlot(slot.id)}
              />
            ))}
          </div>
        )}
      </section>

      <p className="mt-10 max-w-2xl text-xs leading-5 text-muted">
        Every metric is computed on flattened colors: the base and the
        comparison are each composited over the selected backdrop (the base
        toggle sets it for the whole page, each card can override it, and the
        checkerboard counts as white), then compared — so alpha differences
        show up in ΔE, OKLCH Δ and contrast. WCAG defines contrast only for
        opaque colors. ΔE2000 below 2 is generally imperceptible; contrast of
        4.5:1 or higher passes AA for normal text.
      </p>
    </div>
  );
}
