# Color Master

Convert CSS colors between **OKLCH, HSLA, RGBA and HEX** — alpha included — and compare any number of colors against a base with perceptual and accessibility metrics.

Built with Next.js (App Router), Tailwind CSS v4, and [culori](https://culorijs.org) for all color math. Entirely client-side; state lives in the URL, so any view can be shared as a link.

## Tools

### Convert (`/`)

Paste or type a color in any supported syntax — `oklch(0.7 0.15 230 / 0.5)`, `hsla(200, 80%, 50%, 0.5)`, `hsl(200 80% 50% / 0.5)`, `rgba(30, 144, 255, 0.5)`, `rgb(30 144 255 / 50%)`, `#1e90ff80`, 3/4/6/8-digit hex, even named colors — and get all four formats at once, each with one-click copy. Semi-transparent colors get an **alpha preview**: the color over white, over black, and over a checkerboard, with the flattened results ready to copy.

### Compare (`/compare`)

Pick one base color, add as many comparison colors as you like. Each comparison shows:

- **ΔE2000** — CIEDE2000 perceptual difference (with a plain-language label: below 1 is imperceptible, below 2 barely perceptible, …)
- **OKLCH Δ** — Euclidean distance in OKLCH space
- **WCAG 2.1 contrast** — ratio plus AA/AAA pass–fail badges for normal and large text
- **All four formats inline** — every card (and the base) lists its OKLCH/HSL/RGB/HEX values with copy buttons, no toggles
- **Per-color backdrop** — each card and the base can switch its swatch between checkerboard, white, and black; the metrics follow the selection

Input helpers everywhere: native color picker, the EyeDropper screen picker on Chromium browsers, and an **alpha slider** under every input — so you can compare color A at alpha 1 against color B at alpha 0.35 without hand-editing strings. Picking a color preserves the slot's existing alpha, and slider/picker edits re-serialize into the format you typed (an `hsla(…)` draft stays HSLA rather than flipping to hex).

## URL schema

Colors are encoded as bare lowercase hex (6 digits when opaque, 8 with alpha):

- Converter: `/?c=1e90ff80`
- Compare: `/compare?b=1e90ff&c=ffffff,111111cc,336699`

Invalid entries in a pasted URL are silently dropped. Colors outside sRGB are gamut-mapped before encoding (CSS Color 4 algorithm — chroma reduction in OKLCH), and the UI marks sRGB-bound values of out-of-gamut colors with an “sRGB-mapped” chip.

## Semi-transparency rules (worth knowing)

WCAG defines contrast only for opaque colors, so all comparison metrics are computed on **flattened** colors: the base and the comparison are each composited over the card's selected backdrop (white by default; the checkerboard counts as white, black uses black), then compared side by side. This means alpha differences always register — a color at alpha 1 and the same color at alpha 0.35 report a real ΔE and contrast. The same rule feeds ΔE2000, OKLCH distance and contrast, so every number describes the swatches as you see them. This is stated in the UI footnote as well.

Output precision: OKLCH L/C at 4 decimals, hue at 2; HSL at 1 decimal; RGB as integers; alpha at 3 decimals (which round-trips 8-bit alpha exactly — `#…80` ⇄ `0.502`).

## Development

```bash
npm run dev        # dev server
npm run build      # production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # Vitest unit tests (color engine)
npm run e2e        # Playwright end-to-end tests (chromium)
```

The color engine is a pure, framework-free TypeScript module in `src/lib/color/` — parsing, conversion, serialization, alpha compositing, contrast, and difference metrics — fully covered by unit tests. UI flows are covered by Playwright specs in `e2e/`.
