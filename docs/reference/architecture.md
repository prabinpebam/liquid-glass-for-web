# Architecture

The library is a small pipeline that turns options into an SVG filter applied to a DOM
element. The pure parts (math, map generation) are independent of the DOM and are
SSR-safe; only the inject/apply layer touches the document.

## Pipeline

```
options
  → surface profile (height fn → normal)
  → refraction per distance (Snell's law)        [pure]
  → normalized displacement field (half-slice, radial reuse)
  → displacement map + specular map (canvas → dataURL)
  → SVG filter graph (feImage / feDisplacementMap / feBlend)
  → apply to element (filter | backdrop-filter) + size sync
```

See the [concepts](concepts/) for the math behind each stage.

## Modules (`packages/core/src`)

| Module | Responsibility |
|---|---|
| `surface/` | Bezel cross-section height functions and numeric normal |
| `refraction/snell` | Snell's law refracted angle (+ TIR guard) |
| `refraction/displacement-field` | Per-distance displacement magnitudes |
| `refraction/normalize` | Normalize vectors; expose `maxDisplacement` |
| `maps/displacement-map` | Encode field as RGBA image (R=X, G=Y, 128 neutral) |
| `maps/specular-map` | Render rim-light highlight image |
| `filter/svg-filter` | Build the `<filter>` graph |
| `glass` | Public API: orchestrate pipeline + lifecycle |
| `types` | Shared types |

## Lifecycle & DOM ownership

- A single shared `<svg>` "defs host" holds all filters; each instance gets a unique
  filter id and is **refcounted** so the host is removed when the last instance is
  disposed.
- `ResizeObserver` keeps filter image sizes in sync with the element box; rebuilds are
  **debounced** so continuous resizes don't thrash map generation.
- `setScale()` animates the filter `scale` only — **no** map rebuild.
- `dispose()` removes the element's filter, observers, and decrements the refcount.

## Performance principles

- Generate maps **once**; reuse; animate `scale` for fades.
- Compute on a **half-slice** and rotate radially (O(radius)).
- Optional **OffscreenCanvas**/worker generation for large maps.
- Respect `prefers-reduced-motion`.

See [../PROJECT-PLAN.md](../PROJECT-PLAN.md) §3 and §8 for rationale.
