"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Convert" },
  { href: "/compare", label: "Compare" },
];

export function Header() {
  const pathname = usePathname();
  return (
    <header className="border-b border-edge">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-mono text-sm font-semibold uppercase tracking-[0.25em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
        >
          Color
          <span aria-hidden style={{ color: "var(--accent)" }}>
            ▮
          </span>
          Master
        </Link>
        <nav
          aria-label="Tools"
          className="flex gap-1 font-mono text-xs uppercase tracking-[0.15em]"
        >
          {LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`border-b-2 px-3 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-foreground ${
                  active
                    ? "border-[var(--accent)] text-foreground"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
