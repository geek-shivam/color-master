"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

/**
 * URL search params as shareable state. Writes go through
 * history.replaceState — no server round-trip on keystrokes and no history
 * entry spam — and Next keeps useSearchParams in sync with native history
 * updates (Next >= 14.2).
 *
 * The hook performs the writes, so it also owns own-write detection:
 * consumers call `isOwnUrl(params)` inside their resync logic to tell their
 * own canonical writes apart from external URL changes (back/forward,
 * pasted links, route navs) without re-deriving and comparing values.
 */
export function useUrlParams() {
  const params = useSearchParams();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<Record<string, string | null>>({});
  // URL the pending writes were armed against; if it changed before the
  // debounce fires (back/forward, route nav), the writes are stale — a late
  // flush would replaceState-stamp them onto the wrong history entry.
  const armedUrl = useRef<string | null>(null);
  // Query string this hook last wrote (or confirmed as already current).
  const lastWritten = useRef<string | null>(null);

  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const currentUrl = window.location.pathname + window.location.search;
    if (armedUrl.current !== null && armedUrl.current !== currentUrl) {
      pending.current = {};
      armedUrl.current = null;
      return;
    }
    armedUrl.current = null;
    const updates = pending.current;
    pending.current = {};
    const next = new URLSearchParams(window.location.search);
    let changed = false;
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) {
        if (next.has(key)) {
          next.delete(key);
          changed = true;
        }
      } else if (next.get(key) !== value) {
        next.set(key, value);
        changed = true;
      }
    }
    lastWritten.current = next.toString();
    if (!changed) return;
    const qs = next.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, []);

  const setParams = useCallback(
    (updates: Record<string, string | null>, opts?: { debounceMs?: number }) => {
      pending.current = { ...pending.current, ...updates };
      armedUrl.current = window.location.pathname + window.location.search;
      if (timer.current) clearTimeout(timer.current);
      const ms = opts?.debounceMs ?? 0;
      if (ms <= 0) {
        flush();
        return;
      }
      timer.current = setTimeout(flush, ms);
    },
    [flush],
  );

  /** Whether these params are exactly what this hook last wrote. */
  const isOwnUrl = useCallback(
    (p: URLSearchParams) =>
      lastWritten.current !== null && p.toString() === lastWritten.current,
    [],
  );

  // Drop (not flush) pending writes on unmount: flushing during a route
  // change would rewrite the destination page's URL.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { params, setParams, isOwnUrl };
}
