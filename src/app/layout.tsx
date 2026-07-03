import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Color Master",
    template: "%s · Color Master",
  },
  description:
    "Convert CSS colors between OKLCH, HSLA, RGBA and HEX — alpha included — and compare any number of colors against a base.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <div
          aria-hidden
          className="h-[3px] w-full"
          style={{ background: "var(--accent)" }}
        />
        <Header />
        <main className="w-full flex-1">{children}</main>
        <footer className="mx-auto w-full max-w-5xl px-6 py-8 font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
          Values follow CSS Color 4 · Contrast per WCAG 2.1 · State lives in the
          URL — copy it to share
        </footer>
      </body>
    </html>
  );
}
