"use client";

import { useCallback, useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getSnapshot = () => typeof window !== "undefined" && !!window.EyeDropper;
const getServerSnapshot = () => false;

/**
 * Browser EyeDropper API (Chromium only). `supported` is false during SSR
 * and flips on the client, so server and client markup stay consistent.
 */
export function useEyeDropper() {
  const supported = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const open = useCallback(async (): Promise<string | null> => {
    if (!window.EyeDropper) return null;
    try {
      const result = await new window.EyeDropper().open();
      return result.sRGBHex;
    } catch (error) {
      // AbortError when the user presses Escape — not an error. Anything
      // else (missing user activation, permissions policy) is worth a trace.
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.warn("EyeDropper failed:", error);
      }
      return null;
    }
  }, []);

  return { supported, open };
}
