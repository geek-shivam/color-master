interface WcagBadgeProps {
  level: "AA" | "AAA";
  variant: "normal" | "large";
  pass: boolean;
}

export function WcagBadge({ level, variant, pass }: WcagBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] ${
        pass
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
          : "border-edge bg-surface-2 text-muted"
      }`}
    >
      <span aria-hidden>{pass ? "✓" : "✗"}</span>
      {level} {variant}
      <span className="sr-only">{pass ? "pass" : "fail"}</span>
    </span>
  );
}
