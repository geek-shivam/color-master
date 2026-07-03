import type { Metadata } from "next";
import { Suspense } from "react";
import { ComparePanel } from "@/components/compare/ComparePanel";

export const metadata: Metadata = {
  title: "Compare",
  description:
    "Compare any number of colors against a base: ΔE2000, OKLCH distance and WCAG contrast.",
};

export default function ComparePage() {
  return (
    <Suspense fallback={null}>
      <ComparePanel />
    </Suspense>
  );
}
