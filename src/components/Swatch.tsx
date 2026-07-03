export type Backdrop = "checker" | "white" | "black";

export const BACKDROP_CLASS: Record<Backdrop, string> = {
  checker: "checkerboard",
  white: "bg-white",
  black: "bg-black",
};

/** Color swatch over a selectable backdrop so alpha is visible. */
export function Swatch({
  css,
  backdrop = "checker",
  className = "",
}: {
  css: string;
  backdrop?: Backdrop;
  className?: string;
}) {
  return (
    <div className={`${BACKDROP_CLASS[backdrop]} relative overflow-hidden ${className}`}>
      <div className="absolute inset-0" style={{ backgroundColor: css }} />
    </div>
  );
}
