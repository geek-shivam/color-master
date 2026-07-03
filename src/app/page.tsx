import type { Metadata } from "next";
import { Suspense } from "react";
import { ConverterPanel } from "@/components/converter/ConverterPanel";

export const metadata: Metadata = {
  title: "Convert",
  description:
    "Convert any CSS color between OKLCH, HSLA, RGBA and HEX with alpha.",
};

export default function ConvertPage() {
  return (
    <Suspense fallback={null}>
      <ConverterPanel />
    </Suspense>
  );
}
