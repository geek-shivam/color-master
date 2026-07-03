"use client";

import type { Color } from "culori";
import { useEffect, useMemo, useState } from "react";
import { AlphaPreview } from "@/components/AlphaPreview";
import { ColorInput } from "@/components/ColorInput";
import { FormatRow } from "@/components/FormatRow";
import { Swatch } from "@/components/Swatch";
import { useUrlParams } from "@/hooks/useUrlColorState";
import {
  decodeColorParam,
  detectFormat,
  draftFormat,
  encodeColorParam,
  formatColor,
  parseColor,
  toAllFormats,
  toCss,
} from "@/lib/color";

const DEFAULT_INPUT = "oklch(0.7 0.15 230 / 0.5)";

interface State {
  draft: string;
  color: Color | null;
  error: string | null;
}

function makeDefaultState(): State {
  const seeded = parseColor(DEFAULT_INPUT);
  return {
    draft: DEFAULT_INPUT,
    color: seeded.ok ? seeded.color : null,
    error: null,
  };
}

export function ConverterPanel() {
  const { params, setParams, isOwnUrl } = useUrlParams();

  const [state, setState] = useState<State>(() => {
    const fromUrl = params.get("c");
    const color = fromUrl ? decodeColorParam(fromUrl) : null;
    if (color) return { draft: formatColor(color, "hex"), color, error: null };
    return makeDefaultState();
  });

  // Resync when the URL changes underneath us (back/forward, pasted link,
  // nav to the bare route). Render-time adjust pattern: the hook flags its
  // own canonical writes; external changes rebuild state, and a removed
  // param resets to the default so the URL never lies.
  const urlParam = params.get("c");
  const [lastUrlParam, setLastUrlParam] = useState(urlParam);
  if (urlParam !== lastUrlParam) {
    setLastUrlParam(urlParam);
    if (!isOwnUrl(params)) {
      if (urlParam === null) {
        setState(makeDefaultState());
      } else {
        const color = decodeColorParam(urlParam);
        if (color) {
          setState({ draft: formatColor(color, "hex"), color, error: null });
        }
      }
    }
  }

  // Signature: the app wears the working color.
  useEffect(() => {
    if (state.color) {
      document.documentElement.style.setProperty("--accent", toCss(state.color));
    }
  }, [state.color]);

  const handleDraftChange = (text: string) => {
    const result = parseColor(text);
    if (result.ok) {
      setState({ draft: text, color: result.color, error: null });
      setParams({ c: encodeColorParam(result.color) }, { debounceMs: 250 });
    } else {
      // Keep the last valid color rendered (dimmed) but always surface why
      // the input doesn't parse — including when it was cleared entirely.
      setState((prev) => ({
        draft: text,
        color: prev.color,
        error: result.error,
      }));
    }
  };

  const handleCommit = (color: Color, opts?: { debounceMs?: number }) => {
    setState((prev) => ({
      draft: formatColor(color, draftFormat(prev.draft)),
      color,
      error: null,
    }));
    setParams({ c: encodeColorParam(color) }, opts);
  };

  const formats = useMemo(
    () => (state.color ? toAllFormats(state.color) : []),
    [state.color],
  );
  const sourceFormat =
    !state.error && state.draft.trim() ? detectFormat(state.draft) : null;

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="sr-only">Color converter</h1>
      <ColorInput
        id="convert-input"
        label="Color — oklch, hsla, rgba or hex"
        draft={state.draft}
        error={state.error}
        currentColor={state.color}
        onDraftChange={handleDraftChange}
        onCommit={handleCommit}
      />
      {sourceFormat && sourceFormat !== "other" && (
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
          parsed as {sourceFormat}
        </p>
      )}
      {state.color && (
        <div className={`transition-opacity ${state.error ? "opacity-40" : ""}`}>
          <Swatch
            css={toCss(state.color)}
            className="mt-6 h-40 w-full rounded-xl border border-edge"
          />
          <section
            aria-label="Converted values"
            className="mt-6 divide-y divide-edge border-y border-edge"
          >
            {formats.map((f) => (
              <FormatRow
                key={f.format}
                label={f.label}
                value={f.value}
                gamutMapped={f.gamutMapped}
              />
            ))}
          </section>
          <div className="mt-8">
            <AlphaPreview color={state.color} />
          </div>
        </div>
      )}
    </div>
  );
}
