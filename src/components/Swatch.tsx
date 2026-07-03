export type Backdrop = "checker" | "white" | "black";

export const BACKDROP_CLASS: Record<Backdrop, string> = {
  checker: "checkerboard",
  white: "bg-white",
  black: "bg-black",
};

/**
 * Color swatch over a selectable backdrop so alpha is visible. With `inset`,
 * the color sits inside a visible backdrop frame — so switching backdrops
 * registers even for fully opaque colors, and the surround can be used to
 * judge simultaneous contrast.
 */
export function Swatch({
  css,
  backdrop = "checker",
  inset = false,
  className = "",
}: {
  css: string;
  backdrop?: Backdrop;
  inset?: boolean;
  className?: string;
}) {
  return (
    <div className={`${BACKDROP_CLASS[backdrop]} relative overflow-hidden ${className}`}>
      <div
        className={`absolute ${inset ? "inset-2 rounded-md" : "inset-0"}`}
        style={{ backgroundColor: css }}
      />
    </div>
  );
}
