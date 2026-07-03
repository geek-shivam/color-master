"use client";

import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

export function CopyButton({ text, label }: { text: string; label: string }) {
  const { state, copy } = useCopyToClipboard();
  return (
    <button
      type="button"
      onClick={() => copy(text)}
      aria-label={label}
      className="shrink-0 rounded border border-edge px-2 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-muted transition-colors hover:border-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      {state === "copied" ? "Copied ✓" : state === "error" ? "Failed" : "Copy"}
      <span aria-live="polite" className="sr-only">
        {state === "copied"
          ? "Copied to clipboard"
          : state === "error"
            ? "Copy failed"
            : ""}
      </span>
    </button>
  );
}
