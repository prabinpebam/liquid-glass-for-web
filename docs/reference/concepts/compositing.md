# Compositing

The final effect combines the **displacement map** (refraction) and the **specular
highlight** into a single SVG filter, then applies that filter to a DOM element.

## The SVG filter graph

Both maps are loaded as separate `<feImage>` inputs. The displacement map drives
`<feDisplacementMap>`; the specular highlight is overlaid with `<feBlend>`.

```html
<svg color-interpolation-filters="sRGB">
  <filter id="liquidGlass">
    <feImage href="{displacementMapDataUrl}"
             x="0" y="0" width="{w}" height="{h}"
             result="displacement_map" />
    <feDisplacementMap in="SourceGraphic" in2="displacement_map"
             scale="{maximumDisplacement}"
             xChannelSelector="R" yChannelSelector="G"
             result="refracted" />
    <feImage href="{specularMapDataUrl}"
             x="0" y="0" width="{w}" height="{h}"
             result="specular" />
    <feBlend in="refracted" in2="specular" mode="screen" />
  </filter>
</svg>
```

> The number and order of filter primitives and their parameters is the most
> **creative** part of the effect — varying them produces different looks.

## Applying it: `filter` vs `backdrop-filter`

- `filter: url(#liquidGlass)` distorts the **element's own content**. Works across
  Safari/Firefox/Chrome. The article uses this for the inline demos.
- `backdrop-filter: url(#liquidGlass)` distorts **what's behind** the element — the
  true "glass panel" look:

  ```css
  .glass-panel { backdrop-filter: url(#liquidGlass); }
  ```

  This is **Chromium-only** (SVG filters as `backdrop-filter` are not in the CSS
  spec). See [../compatibility.md](../compatibility.md).

## Sizing caveat

`backdrop-filter` dimensions do **not** auto-adjust to the element size, so the filter
images must be generated to match the element's box. The library keeps them in sync
with a `ResizeObserver` and regenerates maps when the box changes (debounced).

## Animating cheaply

Animating filter primitive props — especially `scale` — fades the effect without
rebuilding the maps. The library exposes `handle.setScale()` for this.

## Implementation

See `packages/core/src/filter/svg-filter.ts` and `packages/core/src/glass.ts`.

> Concept reference: kube.io, *Liquid Glass in the Browser*. See
> [../attribution.md](../attribution.md).
