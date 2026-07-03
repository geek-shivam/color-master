import { BACKDROP_CLASS, type Backdrop } from "./Swatch";

const OPTIONS: { value: Backdrop; label: string }[] = [
  { value: "checker", label: "Checkerboard backdrop" },
  { value: "white", label: "White backdrop" },
  { value: "black", label: "Black backdrop" },
];

/** Three-way backdrop switch for swatches and metrics: checker, white, black. */
export function BackdropToggle({
  value,
  onChange,
}: {
  value: Backdrop;
  onChange: (backdrop: Backdrop) => void;
}) {
  return (
    <div role="group" aria-label="Swatch backdrop" className="flex gap-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-label={opt.label}
          aria-pressed={value === opt.value}
          title={opt.label}
          onClick={() => onChange(opt.value)}
          className={`h-5 w-5 overflow-hidden rounded border transition-colors focus-visible:outline-2 focus-visible:outline-foreground ${
            value === opt.value
              ? "border-foreground"
              : "border-edge hover:border-muted"
          }`}
        >
          <span
            aria-hidden
            className={`block h-full w-full ${BACKDROP_CLASS[opt.value]}`}
            style={opt.value === "checker" ? { backgroundSize: "8px 8px" } : undefined}
          />
        </button>
      ))}
    </div>
  );
}
