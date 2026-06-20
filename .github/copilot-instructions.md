# Project guidelines — liquid-glass-for-web

## NON-NEGOTIABLE: one canonical Liquid Glass implementation

The Liquid Glass effect is created in **one specific way**, derived from the
documented kube.io filter structure and the shared `Glass` filter component.
You **must not** invent a different or
per-element implementation. Every glass element — the hero lens, buttons, cards,
search field, toggles, checkboxes, FABs, etc. — uses the **same structure**. Only
size-driven parameters (`bezel`, `scaleBase`) may differ between elements, exactly
as the reference varies only its `scaleRatio`.

### The single mechanism — do not deviate

The effect is `backdrop-filter: url(#filter)`, where the SVG filter chain is, in
this exact order:

1. `feGaussianBlur` (SourceGraphic)
2. `feImage` (displacement map) + `feDisplacementMap` — `scale = base * refraction`, channels R/G
3. `feColorMatrix` `type="saturate"`
4. `feImage` (specular map)
5. `feComposite` `operator="in"` (saturated displacement ∩ specular)
6. `feComponentTransfer` on the specular layer — `feFuncA type="linear" slope=specular`
7. `feBlend` (specular-saturated over displaced)
8. `feBlend` (specular-faded over the result)

(The reference adds an optional magnifying-map pre-pass used only for the lens.)

This chain lives in **one place**: `attachGlass()` in
[apps/docs/js/glass.js](apps/docs/js/glass.js).
It is the single source of truth. Components call `attachGlass`; they never
reimplement the filter.

### The rim (border) is the specular map — nothing else

- The bright edge of a glass surface is produced by the **specular map** (the
  specular `feImage`). It is **never** a CSS `border` and **never** a static
  `box-shadow` rim.
- `specularURL()` in `glass.js` is a **verbatim port** of the reference specular
  generator (`Gr` in `blog-Df6HVmF0.js`), invoked there as
  `Gr(400, 250, 120, 25, angle, 2)`. The last arg `i = 2` is a **2× supersample**:
  the map is rendered at double resolution and the `feImage` downscales it for a
  crisp anti-aliased line. The rim profile width is tied to that scale (`l = 2`),
  **not** to the element size — so the lit edge is a **constant ~2px line** on
  every element. For each pixel in the rounded-rect edge ring (scaled space):
  `depth = radius·l − dist`, `N = |normal · lightAxis| · sqrt(1 - (1 - depth/l)²)`,
  `rgb = 255·N`, `alpha = 255·N²·P`. Do not invent a different formula and never
  tie the rim width to the element size or bezel.
- Two properties are non-negotiable:
  - **Directional** — `Math.abs(normal · lightAxis)` lights only **two opposing
    arcs** (aligned with the light axis); the perpendicular sides go dark. Never
    a uniform rim all the way around.
  - **Crisp, not fuzzy** — the cross-rim profile `sqrt(1 - (1 - u)²)` is a
    semicircular hump that is 0 at the very edge and peaks just inside, giving a
    thin tube-like line. Never a soft gradient that bleeds inward.
- The rim is **thin** (~1.5-4px) and independent of the much wider displacement
  bezel. The bezel refracts; the rim only catches light at the border. **Never**
  widen the rim to the bezel.
- **Forbidden:** `border: 1px solid ...` on glass elements, per-element `.lgc-*`
  box-shadow rims, and invented inset white/black "lip" hairlines. If an element
  looks borderless or its rim looks too thick, fix the **shared** specular map /
  `specular` opacity in the engine so the thin rim reads uniformly everywhere —
  do **not** patch a single element.

### box-shadow / chrome

- CSS `box-shadow` on glass elements is an **elevation drop shadow only**
  (`0 7px 20px rgba(0,0,0,.18)`), shared by all `.lgc-*` rules in
  [apps/docs/css/docs.css](apps/docs/css/docs.css).
- The reference's dual inset bloom (`inset ±x,±y 24px black/white`) is a
  **drag-reactive directional sheen** driven by pointer/opacity springs; at rest
  it is neutral. It is not a border. Only the interactive lens may animate it.

### The hero lens is the canonical demonstration

`glassLens()` in
[apps/docs/js/components.js](apps/docs/js/components.js)
is the showcase of the effect. If the effect looks wrong anywhere, fix the shared
engine so the lens is perfect — every other element inherits the fix. Never solve
the problem element by element.
