import { CopyButton } from "./CopyButton";

interface FormatRowProps {
  label: string;
  value: string;
  gamutMapped?: boolean;
}

export function FormatRow({ label, value, gamutMapped = false }: FormatRowProps) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="w-14 shrink-0 font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
        {label}
      </span>
      <code className="min-w-0 flex-1 truncate font-mono text-sm" title={value}>
        {value}
      </code>
      {gamutMapped && (
        <span
          className="shrink-0 rounded-full border border-edge px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted"
          title="The original color is outside sRGB; this value has been gamut-mapped."
        >
          sRGB-mapped
        </span>
      )}
      <CopyButton text={value} label={`Copy ${label} value`} />
    </div>
  );
}
